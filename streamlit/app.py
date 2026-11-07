import streamlit as st
import requests

# Configuração da página
st.set_page_config(page_title="Pricing Clássico", page_icon="💸", layout="centered")

st.title("💸 Precificação Inteligente")
st.markdown("**Interface Clássica (Streamlit) acoplada ao Motor Avançado (FastAPI)**")

# Endpoints da API V2 (lembre-se de garantir que o backend está rodando no terminal)
API_BASE_URL = "http://localhost:8000/api/v1"

st.sidebar.header("🔐 Configurações")
user_id = st.sidebar.text_input("User ID (Obrigatório para o banco)", value="12345-usuario-streamlit")
loja_cliente = st.sidebar.text_input("Sua Loja (Excluída da busca)", value="SuaLoja.com")

st.header("1. Pesquisa de Mercado (IA)")
nome_produto = st.text_input("Qual produto deseja pesquisar?", placeholder="Ex: Amendoim Crocante Yoki 120g")

# Botão de pesquisa
if st.button("Pesquisar Concorrentes"):
    if not nome_produto:
        st.warning("Digite o nome do produto.")
    else:
        with st.spinner("Buscando no Google e filtrando com IA no Backend V2..."):
            try:
                # Fazendo o POST para a rota de busca do FastAPI
                resposta = requests.post(
                    f"{API_BASE_URL}/market/search",
                    json={
                        "nome_produto": nome_produto,
                        "loja_cliente": loja_cliente,
                        "localizacao": "Brasil"
                    }
                )
                if resposta.status_code == 200:
                    dados_mercado = resposta.json()
                    st.success("Busca finalizada!")
                    preco_ancora = dados_mercado.get("mediana")
                    st.session_state["preco_ancora"] = preco_ancora
                    
                    st.write(f"**Preço Âncora Encontrado (Mediana):** R$ {preco_ancora:.2f}")
                    with st.expander("Ver produtos que a IA considerou idênticos"):
                        st.json(dados_mercado.get("produtos", []))
                else:
                    st.error(f"Erro na API: {resposta.text}")
            except Exception as e:
                st.error(f"Erro de conexão. O Backend (FastAPI) está rodando na porta 8000? Detalhe: {e}")

st.divider()

st.header("2. Cálculos Financeiros")

# Pega o preço âncora da pesquisa (se existir)
ancora_atual = st.session_state.get("preco_ancora", 0.0)

col1, col2 = st.columns(2)
with col1:
    custo = st.number_input("Custo Base (R$)", min_value=0.01, value=50.0, step=0.5)
    comissao = st.number_input("Comissão do Marketplace (%)", min_value=0.0, max_value=99.0, value=15.0, step=0.5)
with col2:
    frete = st.number_input("Frete Fixo (R$)", min_value=0.0, value=15.0, step=0.5)
    margem = st.number_input("Margem de Lucro Alvo (%)", min_value=0.0, max_value=99.0, value=10.0, step=0.5)

fator_eve = st.slider("Fator EVE (%)", min_value=-10, max_value=10, value=0, help="Menor que 0: Giro Agressivo. Maior que 0: Posicionamento Premium.")

# O usuário pode alterar a âncora manualmente se quiser
ancora_manual = st.number_input("Preço Âncora (R$)", min_value=0.0, value=float(ancora_atual), step=1.0)

if st.button("Calcular Preço Ideal", type="primary", use_container_width=True):
    with st.spinner("Enviando cálculos para o motor V2..."):
        try:
            # Prepara o JSON nos mesmos moldes do Next.js
            payload = {
                "user_id": user_id,
                "nome_produto": nome_produto if nome_produto else "Teste Streamlit",
                "custo_base": float(custo),
                "frete_fixo": float(frete),
                "taxa_comissao": float(comissao) / 100,
                "margem_alvo": float(margem) / 100,
                "fator_posicionamento_eve": float(fator_eve) / 100,
                "preco_concorrente": float(ancora_manual) if ancora_manual > 0 else None
            }
            
            # Chama a rota de cálculo do FastAPI
            resposta_calc = requests.post(f"{API_BASE_URL}/pricing/calculate", json=payload)
            
            if resposta_calc.status_code == 200:
                resultado = resposta_calc.json()
                
                st.subheader(f"💡 Preço Sugerido: R$ {resultado['preco_sugerido']:.2f}")
                st.caption(f"Status da Estratégia: **{resultado['status']}**")
                
                if resultado['viavel']:
                    st.success(resultado['mensagem'])
                else:
                    st.error(resultado['mensagem'])
                    
                c1, c2 = st.columns(2)
                c1.metric("Preço Piso (Zero Lucro)", f"R$ {resultado['piso']:.2f}")
                if resultado['teto']:
                    c2.metric("Preço Teto", f"R$ {resultado['teto']:.2f}")
            else:
                st.error(f"Erro no motor de precificação: {resposta_calc.text}")
        except Exception as e:
            st.error(f"Erro de conexão. O Backend (FastAPI) está rodando na porta 8000? Detalhe: {e}")
