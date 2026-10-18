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


@app.get("/api/v1/test-llm", tags=["Health"])
def test_llm():
    import requests
    import os
    groq_key = os.getenv("GROQ_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    
    results = {}

    # 1. Teste Groq com o modelo atual de market_service.py
    if groq_key:
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={
                    "model": "openai/gpt-oss-120b",
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 10
                },
                timeout=5.0
            )
            results["groq_current_model_gpt_oss"] = {
                "status_code": resp.status_code,
                "response": resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text
            }
        except Exception as e:
            results["groq_current_model_gpt_oss"] = {"error": str(e)}

        # 2. Teste Groq com modelo padrão Llama 3.3 70B
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 10
                },
                timeout=5.0
            )
            results["groq_llama_3_3_70b"] = {
                "status_code": resp.status_code,
                "response": resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text
            }
        except Exception as e:
            results["groq_llama_3_3_70b"] = {"error": str(e)}

    # 3. Teste OpenRouter
    if openrouter_key:
        try:
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {openrouter_key}", "Content-Type": "application/json"},
                json={
                    "model": "google/gemini-2.0-flash-001",
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 10
                },
                timeout=5.0
            )
            results["openrouter_gemini"] = {
                "status_code": resp.status_code,
                "response": resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text
            }
        except Exception as e:
            results["openrouter_gemini"] = {"error": str(e)}

    return results
