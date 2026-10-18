"""
Router — POST /api/v1/pricing/calculate

Recebe os parâmetros financeiros e a âncora de mercado,
delega ao pricing_engine e retorna a recomendação.
"""

from fastapi import APIRouter, HTTPException

from app.schemas import PricingRequest, PricingResponse
from app.services.pricing_service import calcular

router = APIRouter(prefix="/pricing", tags=["Pricing"])


@router.post(
    "/calculate",
    response_model=PricingResponse,
    summary="Calcular preço ideal",
    description="Executa o motor de precificação determinístico com base nos custos, "
                "taxas e âncora de mercado fornecidos.",
)
def calculate_pricing(body: PricingRequest) -> PricingResponse:
    resultado = calcular(
        custo_base=body.custo_base,
        frete_fixo=body.frete_fixo,
        taxa_comissao=body.taxa_comissao,
        margem_alvo=body.margem_alvo,
        preco_concorrente=body.preco_concorrente,
        fator_posicionamento_eve=body.fator_posicionamento_eve,
    )

    if "viavel" not in resultado:
        raise HTTPException(
            status_code=422,
            detail=resultado.get("mensagem", "Erro interno no cálculo."),
        )

    status = resultado.get("status", "VOO_CEGO")

    return PricingResponse(
        viavel=resultado["viavel"],
        piso=resultado["piso"],
        teto=resultado.get("teto"),
        preco_sugerido=resultado["preco_sugerido"],
        preco_com_margem_alvo=resultado["preco_com_margem_alvo"],
        status=status,
        mensagem=resultado["mensagem"],
    )
