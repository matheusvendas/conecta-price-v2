from schemas import PricingRequest
from core.pricing_engine import calcular_preco_ideal
from pydantic import ValidationError

# ----------------------------------------------------
# TESTE 1: Simulando um usuário enviando dados corretos
# ----------------------------------------------------
dados_do_usuario = {
    "custo_base": 100.0,
    "frete_fixo": 15.0,
    "taxa_comissao": 0.15,          # 15%
    "margem_alvo": 0.10,            # 10%
    "preco_concorrente": 160.0,
    "fator_posicionamento_eve": -0.5 # -3%
}

# 1. O Schema valida os dados
requisicao = PricingRequest(**dados_do_usuario)
print("Dados validados com sucesso pelo Pydantic!")

# 2. O Core executa o cálculo com os dados validados
resultado = calcular_preco_ideal(
    custo_base=requisicao.custo_base,
    frete_fixo=requisicao.frete_fixo,
    taxa_comissao=requisicao.taxa_comissao,
    margem_alvo=requisicao.margem_alvo,
    preco_concorrente=requisicao.preco_concorrente,
    fator_posicionamento_eve=requisicao.fator_posicionamento_eve,
)

print("Resultado do cálculo:", resultado)
# Saída esperada: {'viavel': True, 'piso': 135.29, 'teto': 155.2, 'preco_sugerido': 155.2, ...}


# ----------------------------------------------------
# TESTE 2: O que acontece se o usuário mandar dados absurdos?
# ----------------------------------------------------
try:
    dados_invalidos = {
        "custo_base": -50.0,    # Custo negativo! (viola gt=0)
        "frete_fixo": 10.0,
        "taxa_comissao": 1.5,   # 150% de comissão! (viola lt=1.0)
        "margem_alvo": 0.1,
        "fator_posicionamento_eve": 0.0
    }
    requisicao_ruim = PricingRequest(**dados_invalidos)
except ValidationError as erro:
    print("\nO Pydantic bloqueou antes de chegar no cálculo:")
    print(erro)
