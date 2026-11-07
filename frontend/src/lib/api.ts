import type {
  MarketSearchRequest,
  MarketSearchResponse,
  PricingRequest,
  PricingResponse,
} from "@/types";

// Diretriz 4: URL da API vem de variável de ambiente, com fallback resiliente (localhost / 127.0.0.1 / proxy Next.js).
const ENV_API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

async function postWithFallback<TRequest, TResponse>(
  path: string,
  body: TRequest,
  errorPrefix: string
): Promise<TResponse> {
  // Lista de candidatos em ordem de prioridade para evitar erros de IPv6 (localhost vs 127.0.0.1 no Windows) ou CORS
  const baseCandidates = Array.from(
    new Set(
      [
        ENV_API_BASE,
        "", // Proxy relativo do Next.js (rewrites em next.config.mjs)
        "http://127.0.0.1:8000",
        "http://localhost:8000",
      ].filter(( candidate, idx ) => idx === 1 || Boolean(candidate))
    )
  );

  let lastNetworkError: unknown = null;

  for (const base of baseCandidates) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(
          error?.detail || `${errorPrefix} (HTTP ${res.status})`
        );
      }

      return res.json();
    } catch (err) {
      // Se foi um erro HTTP retornado pela API (ex: 404 ou 422), repassa imediatamente
      if (err instanceof Error && !err.message.toLowerCase().includes("fetch")) {
        throw err;
      }
      lastNetworkError = err;
    }
  }

  throw new Error(
    `Não foi possível conectar ao backend FastAPI (porta 8000). Certifique-se de que o servidor Python está rodando (ex: "uvicorn app.main:app --reload --port 8000" dentro da pasta backend).`
  );
}

/**
 * POST /api/v1/market/search
 * Busca concorrentes no Google Shopping via backend.
 */
export async function searchMarket(
  body: MarketSearchRequest
): Promise<MarketSearchResponse> {
  return postWithFallback<MarketSearchRequest, MarketSearchResponse>(
    "/api/v1/market/search",
    body,
    "Erro na busca de mercado"
  );
}

/**
 * POST /api/v1/pricing/calculate
 * Envia os parâmetros financeiros e recebe a recomendação do engine.
 */
export async function calculatePricing(
  body: PricingRequest
): Promise<PricingResponse> {
  return postWithFallback<PricingRequest, PricingResponse>(
    "/api/v1/pricing/calculate",
    body,
    "Erro no cálculo de preço"
  );
}
