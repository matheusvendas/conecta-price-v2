import type {
  MarketSearchRequest,
  MarketSearchResponse,
  PricingRequest,
  PricingResponse,
} from "@/types";

// Diretriz 4: URL da API vem de variável de ambiente, sem hardcode.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * POST /api/v1/market/search
 * Busca concorrentes no Google Shopping via backend.
 */
export async function searchMarket(
  body: MarketSearchRequest
): Promise<MarketSearchResponse> {
  const res = await fetch(`${API_BASE}/api/v1/market/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      error?.detail || `Erro na busca de mercado (HTTP ${res.status})`
    );
  }

  return res.json();
}

/**
 * POST /api/v1/pricing/calculate
 * Envia os parâmetros financeiros e recebe a recomendação do engine.
 */
export async function calculatePricing(
  body: PricingRequest
): Promise<PricingResponse> {
  const res = await fetch(`${API_BASE}/api/v1/pricing/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      error?.detail || `Erro no cálculo de preço (HTTP ${res.status})`
    );
  }

  return res.json();
}
