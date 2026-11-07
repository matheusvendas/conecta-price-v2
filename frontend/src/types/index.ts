// ──────────────────────────────────────────────
// Types — Espelham os schemas Pydantic do backend
// ──────────────────────────────────────────────

// === Market Search ===

export interface MarketSearchRequest {
  nome_produto: string;
  loja_cliente?: string;
  localizacao?: string;
  usar_ia?: boolean;
  without_blacklist?: boolean;
  lojas_blacklist?: string[];
}

export interface MarketProduct {
  title: string;
  source: string;
  price: number;
  link: string | null;
  image_url: string | null;
}

export interface MarketSearchResponse {
  produtos: MarketProduct[];
  media: number;
  mediana: number;
}

// === Pricing Calculation ===

export interface PricingRequest {
  custo_base: number;
  frete_fixo: number;
  taxa_comissao: number;    // decimal: 0.15 = 15%
  margem_alvo: number;      // decimal: 0.10 = 10%
  preco_concorrente: number | null;
  fator_posicionamento_eve: number; // decimal: -0.03 = -3%
}

export interface PricingResponse {
  viavel: boolean;
  piso: number;
  teto: number | null;
  preco_sugerido: number;
  preco_com_margem_alvo: number;
  status: "INVIÁVEL" | "COMPETITIVO/SUB-ÓTIMO" | "ÓTIMO" | "VOO_CEGO";
  mensagem: string;
}
