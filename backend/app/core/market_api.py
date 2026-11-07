import requests
import os
from pathlib import Path
import pandas as pd
from typing import Optional
from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(_BACKEND_DIR / ".env")
load_dotenv(_BACKEND_DIR.parent / ".env")
load_dotenv()

def buscar_preco_concorrente(nome_produto: str, localizacao: str = "") -> Optional[pd.DataFrame]:
    """
    Busca os dados do produto utilizando a API do Serper (Google Shopping).
    
    Parâmetros:
        nome_produto: O nome do produto para pesquisa.
        localizacao: A localização geográfica da busca.
        
    Retorna:
        Um DataFrame Pandas bruto com os produtos encontrados (a filtragem de blacklist ocorre no tratar_df),
        ou None em caso de falha ou ausência de dados.
    """
    api_key = os.getenv("SERPER_API_KEY") or os.getenv("SERPAPI_KEY")
    url = "https://google.serper.dev/shopping"
    
    parametros = {
        "q": nome_produto,
        "hl": "pt-br",
        "gl": "br",   
        "num": 10,
        "apiKey": api_key
    }
    
    if localizacao.strip():
        parametros["location"] = localizacao.strip()

    try:
        response = requests.get(url, params=parametros, timeout=10)
        response.raise_for_status()
        
        dados = response.json()
        produtos = dados.get("shopping", [])
        
        if not produtos:
            return None
            
        df = pd.DataFrame(produtos)
        
        # O DataFrame precisa ter no mínimo as colunas essenciais
        colunas_esperadas = ["title", "source", "link", "price"]
        for col in colunas_esperadas:
            if col not in df.columns:
                df[col] = None
        
        return df

    except (requests.exceptions.RequestException, ValueError, KeyError, TypeError) as e:
        print(f"Erro ao consultar mercado: {e}")
        return None
