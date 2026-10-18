"""
Schemas Pydantic — Contratos de entrada e saída da API.

Todas as validações de domínio ficam aqui. Nenhuma lógica de negócio.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# Market Search
# ──────────────────────────────────────────────

class MarketSearchRequest(BaseModel):
    nome_produto: str = Field(
        ...,
        min_length=1,
        description="Termo de busca no Google Shopping",
        examples=["cadeira gamer"],
    )
    loja_cliente: str = Field(
        default="",
        description="Nome da loja do próprio cliente (será excluída da busca — blacklist)",
        examples=["Pichau"],
    )
    localizacao: str = Field(
        default="",
        description="Localização geográfica para a busca",
        examples=["Fortaleza, Ceara"],
    )
    usar_ia: bool = Field(
        default=True,
        description="Se verdadeiro, passa os resultados pelo filtro do LLM (lento, porém preciso)",
        examples=[True],
    )
    without_blacklist: bool = Field(
        default=False,
        description="Se verdadeiro, desativa a blacklist padrão de grandes marketplaces (Amazon, Shopee, etc.)",
        examples=[False],
    )
    lojas_blacklist: list[str] = Field(
        default=[],
        description="Lista de lojas a serem excluídas da busca",
        examples=["Pichau", "Kabum"],
    )


class MarketProduct(BaseModel):
    title: str
    source: str
    price: float = Field(..., description="Preço limpo em R$ (numérico)")
    link: Optional[str] = None
    image_url: Optional[str] = None


class MarketSearchResponse(BaseModel):
    produtos: List[MarketProduct]
    media: float = Field(..., description="Média aritmética dos preços encontrados")
    mediana: float = Field(..., description="Mediana dos preços encontrados")


# ──────────────────────────────────────────────
# Pricing Calculation
# ──────────────────────────────────────────────

class PricingRequest(BaseModel):
    custo_base: float = Field(
        ...,
        gt=0,
        description="Custo de aquisição do produto (R$)",
        examples=[100.0],
    )
    frete_fixo: float = Field(
        ...,
        ge=0,
        description="Custo logístico fixo por unidade (R$)",
        examples=[10.0],
    )
    taxa_comissao: float = Field(
        ...,
        ge=0.0,
        lt=1.0,
        description="Comissão do marketplace como decimal (0.15 = 15%)",
        examples=[0.15],
    )
    margem_alvo: float = Field(
        ...,
        ge=0.0,
        lt=1.0,
        description="Margem de lucro desejada como decimal (0.10 = 10%)",
        examples=[0.10],
    )
    preco_concorrente: Optional[float] = Field(
        default=None,
        description="Âncora de mercado (preço médio dos concorrentes selecionados). None ativa o Voo Cego.",
        examples=[150.0],
    )
    fator_posicionamento_eve: float = Field(
        ...,
        ge=-0.10,
        le=0.10,
        description="Fator EVE de posicionamento estratégico (-10% a +10% como decimal)",
        examples=[-0.03],
    )


class PricingResponse(BaseModel):
    viavel: bool = Field(..., description="Se a operação é financeiramente viável")
    piso: float = Field(..., description="Preço mínimo (break-even)")
    teto: Optional[float] = Field(None, description="Teto EVE (None quando em Voo Cego)")
    preco_sugerido: float = Field(..., description="Preço recomendado pelo engine")
    preco_com_margem_alvo: float = Field(..., description="Preço necessário para atingir a margem alvo")
    status: str = Field(
        ...,
        description="Estado da operação: INVIÁVEL | COMPETITIVO/SUB-ÓTIMO | ÓTIMO | VOO_CEGO",
    )
    mensagem: str = Field(..., description="Explicação textual da decisão do engine")
