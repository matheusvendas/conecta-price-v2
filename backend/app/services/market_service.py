"""
Market Service — Wrapper sobre market_api + tratar_df legados.

Resolve o caminho da pasta raiz (Pricing/) via pathlib para garantir
que os imports dos módulos legados funcionem independente do CWD do Uvicorn.
Adicionado Filtro Semântico LLM Batch Curator para evitar misturar packs/kits.
"""

import sys
import os
import re
import json
import requests
import pandas as pd
from pathlib import Path
from typing import Optional
from loguru import logger

from app.core.market_api import buscar_preco_concorrente
from app.core.tratar_df import tratamento


def _filtrar_kits_deterministico(produtos: list[dict], nome_alvo: str) -> list[dict]:
    """
    Filtro determinístico de segurança (usado como pré-limpeza e fallback caso o LLM
    retorne vazio ou falhe). Se o produto alvo não for um kit/combo, remove ofertas
    que claramente são kits, combos, fardos ou múltiplas unidades/caixas.
    """
    alvo_lower = nome_alvo.lower()
    alvo_eh_kit = bool(
        re.search(r"\b(kit|combo|pack|fardo|atacado|caixa com|c/\s*\d+\s*un)", alvo_lower)
    )
    if alvo_eh_kit:
        return produtos

    padrao_kit = re.compile(
        r"(\bkit\b|\bcombo\b|\bfardo\b|\batacado\b|\bleve\s+\d+|\bpack\b|\b[2-9]\d*\s*unidades\b|\b\d+\s*caixas\b)",
        re.IGNORECASE,
    )
    filtrados = [p for p in produtos if not padrao_kit.search(p.get("title", ""))]
    return filtrados if filtrados else produtos


def _filtrar_unidades_via_llm(produtos: list[dict], nome_alvo: str) -> list[dict]:
    """
    Filtro semântico com LLM para remover packs, kits, combos e itens errados.
    Usa compressão de payload (apenas id, title, price) para salvar tokens e 
    garantir baixa latência.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not produtos:
        return _filtrar_kits_deterministico(produtos, nome_alvo)

    # 1. Compressão do Payload com chaves temporárias
    payload_minimo = []
    mapa_produtos = {}
    for idx, prod in enumerate(produtos):
        prod_id = str(idx)
        mapa_produtos[prod_id] = prod
        payload_minimo.append({
            "id": prod_id,
            "title": prod.get("title", ""),
            "price": prod.get("price", 0.0)
        })

    prompt_sistema = (
        f"Você é um especialista em curadoria de produtos de e-commerce e varejo farmacêutico/alimentício.\n"
        f"O produto pesquisado pelo usuário (muitas vezes vindo de um cadastro de ERP) é: '{nome_alvo}'.\n\n"
        f"Sua tarefa é analisar a lista JSON de ofertas do Google Shopping e aprovar as ofertas que correspondem ao produto em venda unitária (avulsa).\n"
        f"Estruture sua resposta APENAS como um objeto JSON válido seguindo exatamente este formato:\n"
        f"{{\n"
        f"  \"analise_alvo\": {{\n"
        f"    \"marca_ou_fabricante\": \"...\",\n"
        f"    \"produto_base\": \"...\",\n"
        f"    \"quantidade_tamanho\": \"...\",\n"
        f"    \"atributos_flexiveis\": \"(termos de ERP como 'Unidade', nome de laboratório/holding como 'Opella'/'Sanofi' ou detalhes que podem faltar na vitrine)\"\n"
        f"  }},\n"
        f"  \"ids_aprovados\": [\"0\", \"1\"]\n"
        f"}}\n\n"
        f"Regras CRÍTICAS para aprovar um item em 'ids_aprovados':\n"
        f"1. FOCO NO NOME COMERCIAL DO PRODUTO: Nomes vindos de ERP costumam trazer prefixos ('Unidade', 'UN', 'CX') e o nome corporativo do fabricante/laboratório (ex: 'Opella Novalgina', 'Sanofi Dorflex', 'Mondelez Bis'). As lojas NÃO colocam o fabricante no título, apenas o nome comercial ('Novalgina', 'Dorflex', 'Bis'). Aprove mesmo sem o nome do laboratório!\n"
        f"2. TOLERÂNCIA A DIVERGÊNCIAS DE CADASTRO: Cadastros de ERP frequentemente têm erros de digitação de grandeza (ex: '1mg' quando o produto real é '1g') ou contagens ligeiramente diferentes da embalagem padrão de mercado (ex: '13 comprimidos' vs '10 comprimidos', ou títulos que nem informam a quantidade de comprimidos). Se for o mesmo produto comercial em apresentação unitária próxima, APROVE.\n"
        f"3. EXCLUSÃO RIGOROSA DE KITS E MÚLTIPLAS UNIDADES: Se o alvo for uma unidade avulsa, EXCLUA SEMPRE ofertas que sejam KITS, COMBOS, FARDOS ou MÚLTIPLAS CAIXAS (ex: 'Kit...', '2 Unidades', 'Leve 3', 'Pack'). Não confunda '10 Comprimidos' (1 caixa com 10 comp.) com '2 Unidades' (2 caixas).\n"
        f"4. EVITE RETORNAR LISTA VAZIA: Se houver ofertas unitárias (avulsas) do mesmo produto base na lista, aprove as mais próximas em vez de reprovar todas.\n"
        f"Responda APENAS com o JSON válido, sem markdown e sem texto fora das chaves {{}}."
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "openai/gpt-oss-120b",
        "temperature": 0.1,
        "messages": [
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": json.dumps(payload_minimo, ensure_ascii=False)}
        ]
    }

    try:
        logger.info(f"[LLM BATCH CURATOR] Iniciando filtro para o alvo '{nome_alvo}' com {len(payload_minimo)} produtos.")
        logger.debug(f"Payload minimizado enviado: {json.dumps(payload_minimo, ensure_ascii=False)}")
        # Tratamento Gracioso: Timeout de 6s
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=6.0
        )
        response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"].strip()
        
        # Extração segura do bloco JSON e remoção de vírgulas finais acidentais (trailing commas)
        inicio_json = content.find("{")
        fim_json = content.rfind("}")
        if inicio_json != -1 and fim_json != -1 and fim_json > inicio_json:
            content = content[inicio_json : fim_json + 1]
        content = re.sub(r",\s*([\]}])", r"\1", content)
        logger.debug(f"[LLM BATCH CURATOR] Resposta bruta da IA: {content}")

        resposta_json = json.loads(content)

        if not isinstance(resposta_json, dict) or "ids_aprovados" not in resposta_json:
            raise ValueError("O LLM não retornou o objeto JSON esperado com a chave 'ids_aprovados'.")
            
        ids_aprovados_raw = resposta_json["ids_aprovados"]
        ids_normalizados = [
            str(item.get("id", "")) if isinstance(item, dict) else str(item)
            for item in (ids_aprovados_raw if isinstance(ids_aprovados_raw, list) else [])
        ]

        # 2. Intersecção: mapear de volta os aprovados mantendo o DTO completo
        produtos_filtrados = [
            mapa_produtos[pid]
            for pid in ids_normalizados
            if pid in mapa_produtos
        ]

        logger.success(
            f"[LLM BATCH CURATOR] Concluído! IDs aprovados: {ids_normalizados} -> Retidos {len(produtos_filtrados)} produtos (Original: {len(produtos)})."
        )

        # Proteção: se o LLM alucinar e remover todos, aplicamos o filtro determinístico anti-kit sobre a lista original
        if not produtos_filtrados:
            logger.warning("LLM filtrou todos os produtos. Aplicando fallback determinístico anti-kit.")
            return _filtrar_kits_deterministico(produtos, nome_alvo)

        return _filtrar_kits_deterministico(produtos_filtrados, nome_alvo)

    except requests.exceptions.HTTPError as e:
        logger.error(f"[LLM BATCH CURATOR] Falha na API. Código: {e.response.status_code}. Detalhe: {e.response.text}")
        return _filtrar_kits_deterministico(produtos, nome_alvo)
    except Exception as e:
        logger.error(f"[LLM BATCH CURATOR] Falha no filtro LLM, retornando fallback anti-kit. Erro: {e}")
        return _filtrar_kits_deterministico(produtos, nome_alvo)


def buscar_e_tratar(
    nome_produto: str,
    loja_cliente: str = "",
    localizacao: str = "",
    usar_ia: bool = True,
    without_blacklist: bool = False,
    lojas_blacklist: list[str] = []
) -> Optional[dict]:
    """
    Orquestra a busca no Google Shopping (Serper), limpeza (blacklist) 
    e cura semântica (LLM).

    Retorna:
        Um dicionário com:
            - produtos: lista de dicts com title, source, price, link, image_url
            - media: média dos preços curados
            - mediana: mediana dos preços curados
        Ou None se nenhum produto válido for encontrado.
    """
    # 1. Buscar dados brutos na API
    logger.info(f"Iniciando busca de mercado para: '{nome_produto}'")
    df_bruto = buscar_preco_concorrente(nome_produto, localizacao)

    if df_bruto is None or df_bruto.empty:
        return None

    # 2. Limpar e filtrar (blacklist, parse de preços básicos)
    df_limpo = tratamento(
        df_bruto,
        loja_cliente=loja_cliente,
        without_blacklist=without_blacklist,
        lojas_blacklist=lojas_blacklist
    )

    if df_limpo.empty:
        return None

    # 3. Converter para lista de dicts serializável (DTO)
    produtos = []
    for _, row in df_limpo.iterrows():
        raw_link = row.get("link")
        raw_img = row.get("imageUrl")
        produtos.append({
            "title": str(row.get("title", "")),
            "source": str(row.get("source", "")),
            "price": float(row["price_limpo"]),
            "link": str(raw_link) if pd.notna(raw_link) and raw_link is not None else None,
            "image_url": str(raw_img) if pd.notna(raw_img) and raw_img is not None else None,
        })

    # 4. LLM Batch Curator (Condicional)
    if usar_ia:
        logger.info(f"Enviando {len(produtos)} produtos curados do dataframe para o LLM Batch Curator...")
        produtos = _filtrar_unidades_via_llm(produtos, nome_produto)

        
        if not produtos:
            return None

    # 5. Estatísticas agregadas calculadas com a base curada
    precos = [p["price"] for p in produtos]
    n = len(precos)
    media = sum(precos) / n
    
    precos_ordenados = sorted(precos)
    if n % 2 == 0:
        mediana = (precos_ordenados[n//2 - 1] + precos_ordenados[n//2]) / 2.0
    else:
        mediana = precos_ordenados[n//2]

    return {
        "produtos": produtos,
        "media": round(media, 2),
        "mediana": round(mediana, 2),
    }
