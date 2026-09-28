"""
Pricing Service — Wrapper sobre o pricing_engine legado.

Resolve o caminho da pasta raiz (Pricing/) via pathlib para garantir
que o import do módulo legado funcione independente do CWD do Uvicorn.
"""

import sys
from pathlib import Path

from app.core.pricing_engine import calcular_preco_ideal


def calcular(
    custo_base: float,
    frete_fixo: float,
    taxa_comissao: float,
    margem_alvo: float,
    preco_concorrente: float | None,
    fator_posicionamento_eve: float,
) -> dict:
    """
    Delega o cálculo ao pricing_engine.calcular_preco_ideal() sem
    nenhuma lógica adicional. Apenas adapta a interface.
    """
    resultado = calcular_preco_ideal(
        custo_base=custo_base,
        frete_fixo=frete_fixo,
        taxa_comissao=taxa_comissao,
        margem_alvo=margem_alvo,
        preco_concorrente=preco_concorrente,
        fator_posicionamento_eve=fator_posicionamento_eve,
    )
    return resultado
