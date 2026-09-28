"""
Market Service — Wrapper sobre market_api + tratar_df legados.

Resolve o caminho da pasta raiz (Pricing/) via pathlib para garantir
que os imports dos módulos legados funcionem independente do CWD do Uvicorn.
Adicionado Filtro Semântico LLM Batch Curator para evitar misturar packs/kits.
"""

import sys
import os
import json
import requests
from pathlib import Path
from typing import Optional
from loguru import logger

from app.core.market_api import buscar_preco_concorrente
from app.core.tratar_df import tratamento


def _filtrar_unidades_via_llm(produtos: list[dict], nome_alvo: str) -> list[dict]:
    """
    Filtro semântico com LLM para remover packs, kits, combos e itens errados.
    Usa compressão de payload (apenas id, title, price) para salvar tokens e 
    garantir baixa latência.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not produtos:
        return produtos

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
        f"Você é um classificador rigoroso de dados de varejo em um pipeline automatizado. "
        f"O produto alvo buscado é EXATAMENTE: '{nome_alvo}'. "
        f"Analise a lista JSON de ofertas fornecida. Sua tarefa é EXCLUIR qualquer item que:\n"
        f"1. Seja um kit, pack, combo ou venda no atacado (ex: 'c/ 6 caixas', 'leve 3').\n"
        f"2. Tenha uma especificação de quantidade/peso/volume diferente da solicitada (ex: se o alvo pede '4 comprimidos', exclua estritamente as ofertas de '6 comprimidos', '8 comprimidos', etc. Se pedir '500ml', exclua '1L').\n"
        f"3. Seja um acessório, refil ou produto diferente do alvo.\n"
        f"Retorne ÚNICA E EXCLUSIVAMENTE um array JSON com os 'ids' aprovados. Não adicione markdown, crases ou texto explicativo."
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "openai/gpt-oss-120b",
        "messages": [
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": json.dumps(payload_minimo, ensure_ascii=False)}
        ]
    }

    try:
        logger.info(f"[LLM BATCH CURATOR] Iniciando filtro para o alvo '{nome_alvo}' com {len(payload_minimo)} produtos.")
        logger.debug(f"Payload minimizado enviado: {json.dumps(payload_minimo, ensure_ascii=False)}")
        # Tratamento Gracioso: Timeout de 4s
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=4.0
        )
        response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"].strip()
        
        # Parse forçado de formatações acidentais do LLM
        if content.startswith("```json"):
            content = content.replace("```json", "", 1)
        if content.startswith("```"):
            content = content.replace("```", "", 1)
        if content.endswith("```"):
            content = content[:content.rfind("```")]
        content = content.strip()
        logger.debug(f"[LLM BATCH CURATOR] Resposta bruta da IA: {content}")

        ids_aprovados = json.loads(content)

        if not isinstance(ids_aprovados, list):
            raise ValueError("O LLM não retornou uma lista JSON.")

        # 2. Intersecção: mapear de volta os aprovados mantendo o DTO completo
        produtos_filtrados = [
            mapa_produtos[str(pid)] 
            for pid in ids_aprovados 
            if str(pid) in mapa_produtos
        ]

        logger.success(f"[LLM BATCH CURATOR] Concluído! Retidos {len(produtos_filtrados)} produtos (Original: {len(produtos)}).")

        # Proteção: se o LLM alucinar e remover todos, voltamos a lista original
        if not produtos_filtrados:
            logger.warning("LLM filtrou todos os produtos. Fallback para lista original.")
            return produtos

        return produtos_filtrados

    except requests.exceptions.HTTPError as e:
        logger.error(f"[LLM BATCH CURATOR] Falha na API. Código: {e.response.status_code}. Detalhe: {e.response.text}")
        return produtos
    except Exception as e:
        logger.error(f"[LLM BATCH CURATOR] Falha no filtro LLM, retornando bruto. Erro: {e}")
        # Retorna a lista original em caso de qualquer falha
        return produtos


def buscar_e_tratar(
    nome_produto: str,
    loja_cliente: str = "",
    localizacao: str = "",
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
    df_limpo = tratamento(df_bruto, loja_cliente)

    if df_limpo.empty:
        return None

    # 3. Converter para lista de dicts serializável (DTO)
    produtos = []
    for _, row in df_limpo.iterrows():
        produtos.append({
            "title": str(row.get("title", "")),
            "source": str(row.get("source", "")),
            "price": float(row["price_limpo"]),
            "link": row.get("link") if row.get("link") is not None else None,
            "image_url": row.get("imageUrl") if row.get("imageUrl") is not None else None,
        })

    # 4. LLM Batch Curator (Resolução de Entidades / Remoção de Kits)
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
