"""
Router — POST /api/v1/market/search

Recebe o nome do produto, consulta a Serper API (Google Shopping),
aplica a blacklist e retorna os produtos limpos com estatísticas.
"""

from fastapi import APIRouter, HTTPException

from app.schemas import MarketSearchRequest, MarketSearchResponse, MarketProduct
from app.services.market_service import buscar_e_tratar

router = APIRouter(prefix="/market", tags=["Market Research"])


@router.post(
    "/search",
    response_model=MarketSearchResponse,
    summary="Buscar preços de mercado",
    description="Consulta o Google Shopping via Serper API, aplica blacklist de "
                "marketplaces gigantes e retorna os concorrentes válidos.",
)
def search_market(body: MarketSearchRequest) -> MarketSearchResponse:
    resultado = buscar_e_tratar(
        nome_produto=body.nome_produto,
        loja_cliente=body.loja_cliente,
        localizacao=body.localizacao,
    )

    if resultado is None:
        raise HTTPException(
            status_code=404,
            detail="Nenhum concorrente válido encontrado para este produto. "
                   "Tente refinar o nome ou remover a loja da blacklist.",
        )

    produtos = [
        MarketProduct(
            title=p["title"],
            source=p["source"],
            price=p["price"],
            link=p.get("link"),
            image_url=p.get("image_url"),
        )
        for p in resultado["produtos"]
    ]

    return MarketSearchResponse(
        produtos=produtos,
        media=resultado["media"],
        mediana=resultado["mediana"],
    )
