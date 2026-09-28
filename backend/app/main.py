"""
LuLu Tech — Pricing Engine API

Ponto de entrada da aplicação FastAPI.
Configura CORS, carrega variáveis de ambiente e registra os routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import market, pricing

# Carrega o .env da raiz do projeto (Pricing/.env)
# O dotenv procura automaticamente nos diretórios pai.
load_dotenv()

app = FastAPI(
    title="Conecta Price — Pricing Engine API",
    description=(
        "API REST para o motor de precificação determinístico da LuLu Tech. "
        "Consulta preços de mercado via Google Shopping (Serper) e calcula "
        "o preço ideal com base em custos, margens e posicionamento estratégico (EVE)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────
# Permite requisições do frontend Next.js em desenvolvimento.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────
app.include_router(market.router, prefix="/api/v1")
app.include_router(pricing.router, prefix="/api/v1")


@app.get("/", tags=["Health"])
def health_check():
    """Health check — confirma que a API está no ar."""
    return {"status": "ok", "service": "LuLu Tech Pricing Engine API", "version": "1.0.0"}
