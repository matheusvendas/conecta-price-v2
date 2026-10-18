import pandas as pd
import unicodedata

def limpar_texto(texto):
    """Remove acentos e converte para minúscula."""
    if not isinstance(texto, str):
        return texto
    texto = unicodedata.normalize('NFKD', texto).encode('ASCII', 'ignore').decode('utf-8')
    return texto.lower().strip()

def tratamento(df: pd.DataFrame, loja_cliente: str = "", without_blacklist: bool = True, lojas_blacklist: list[str] = []) -> pd.DataFrame:
    """
    Higieniza e normaliza o DataFrame, aplicando a blacklist e tratando os preços.
    """
    # 1. Drop de nulos essenciais
    df_limpo = df.dropna(subset=["title", "price"]).copy()
    
    if df_limpo.empty:
        return df_limpo
        
    # 2. Aplicação da Blacklist
    if not without_blacklist:
        blacklist = [
            "amazon", "amazon.com.br", "magazine luiza", "magalu", 
            "mercadolivre", "mercado livre", "shopee", "americanas", 
            "casas bahia", "ponto", "pontofrio", "extra", 
            "submarino", "shoptime"
        ]
    else:
        blacklist = []

    if loja_cliente and loja_cliente.strip():
        blacklist.append(loja_cliente.strip().lower())

    if lojas_blacklist:
        for loja in lojas_blacklist:
            if isinstance(loja, str) and loja.strip():
                blacklist.append(loja.strip().lower())
        
    df_limpo["source"] = df_limpo["source"].astype(str)
    
    # Proteção: só aplica regex se houver termos na blacklist
    if blacklist:
        import re
        termos_escapados = [re.escape(b) for b in blacklist if b]
        filtro_regex = '|'.join(termos_escapados)
        df_limpo = df_limpo[~df_limpo["source"].str.lower().str.contains(filtro_regex, na=False)]
    
    if df_limpo.empty:
        return df_limpo
        
    # 3. Tratamento matemático da string de preço usando métodos vetorizados do Pandas
    # Transforma para string e remove o que não é número/ponto/virgula usando regex
    precos_str = df_limpo['price'].astype(str).str.replace(r'[^\d.,]', '', regex=True)
    
    # Substitui os separadores para o padrão numérico python e converte
    precos_str = precos_str.str.replace('.', '', regex=False).str.replace(',', '.', regex=False)
    
    # Transforma em numérico e elimina as linhas que não conseguiram ser convertidas (NaN)
    df_limpo['price_limpo'] = pd.to_numeric(precos_str, errors='coerce')
    df_limpo = df_limpo.dropna(subset=['price_limpo'])
    
    # 4. Normalização de Texto (Vetorizada)
    df_limpo['title_norm'] = df_limpo['title'].apply(limpar_texto)
    df_limpo['source_norm'] = df_limpo['source'].apply(limpar_texto)
    
    return df_limpo.reset_index(drop=True)
