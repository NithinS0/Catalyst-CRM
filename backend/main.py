import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import customers, campaigns, agents, webhooks, analytics, health
from backend.config import settings

# ── LangSmith Observability ──────────────────────────────────────────────────
# LangChain / LangGraph automatically pick up these env vars to send traces
# to LangSmith for every LLM call, chain, and graph invocation.
if settings.LANGCHAIN_API_KEY:
    os.environ.setdefault("LANGCHAIN_TRACING_V2", settings.LANGCHAIN_TRACING_V2)
    os.environ.setdefault("LANGCHAIN_ENDPOINT", settings.LANGCHAIN_ENDPOINT)
    os.environ.setdefault("LANGCHAIN_API_KEY", settings.LANGCHAIN_API_KEY)
    os.environ.setdefault("LANGCHAIN_PROJECT", settings.LANGCHAIN_PROJECT)
    print(f"[Catalyst] LangSmith tracing enabled -> project: '{settings.LANGCHAIN_PROJECT}'")
else:
    print("[Catalyst] LangSmith tracing disabled (no LANGCHAIN_API_KEY set).")
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Catalyst CRM API",
    description="AI-Native CRM backend featuring dynamic segments, RAG memory, and LangGraph agent flows.",
    version="1.0.0"
)


# Set up CORS middleware to support Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://catalyst-crmagent.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (each router already has /api prefix defined internally)
app.include_router(customers.router)
app.include_router(customers.segments_router)
app.include_router(campaigns.router)
app.include_router(agents.router)
app.include_router(webhooks.router)
app.include_router(analytics.router)
app.include_router(health.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Catalyst CRM Backend API",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    from backend.database.supabase import execute_query
    try:
        execute_query("SELECT 1;")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        
    return {
        "status": "healthy",
        "database": db_status
    }
