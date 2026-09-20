import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import customers, campaigns, agents, webhooks, analytics, health, auth, onboard, settings as api_settings, super_admin, digital_twin, chat_studio, contact_sales
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

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from backend.utils.tenant import set_current_company_id, set_current_user_role, set_super_admin_override_active
from backend.database.supabase import get_supabase

import time

# High-performance in-memory authentication session cache (TTL: 60 seconds)
# Eliminates 3 remote Supabase roundtrips (~500ms) on every single API request
_AUTH_CACHE = {}
_AUTH_CACHE_TTL = 60.0  # seconds

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # Exclude CORS OPTIONS preflights and public paths
        if (
            request.method == "OPTIONS"
            or path in ["/", "/health", "/docs", "/openapi.json", "/redoc"]
            or path.startswith("/api/auth/")
            or path.startswith("/api/webhooks/")
            or path.startswith("/api/onboard")
            or path.startswith("/api/contact-sales")
        ):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(content="Unauthorized: Missing or invalid token", status_code=401)

        token = auth_header.split(" ")[1]
        try:
            now = time.time()
            cached_auth = _AUTH_CACHE.get(token)
            if cached_auth and cached_auth["expires_at"] > now:
                user = cached_auth["user"]
                company_id = cached_auth["company_id"]
                role = cached_auth["role"]
                company_status = cached_auth["company_status"]
            else:
                supabase = get_supabase()
                user_res = supabase.auth.get_user(token)
                if not user_res or not user_res.user:
                    return Response(content="Unauthorized: Invalid token", status_code=401)

                user_id = user_res.user.id
                profile_res = supabase.table("profiles").select("company_id, role").eq("id", user_id).single().execute()
                if not profile_res.data:
                    return Response(content="Unauthorized: User profile not found", status_code=401)

                company_id = profile_res.data.get("company_id")
                role = profile_res.data.get("role", "analyst")
                if not company_id:
                    return Response(content="Unauthorized: User not assigned to a company", status_code=401)

                comp_res = supabase.table("companies").select("status").eq("id", company_id).single().execute()
                company_status = comp_res.data.get("status") if comp_res.data else "active"

                user = user_res.user
                _AUTH_CACHE[token] = {
                    "user": user,
                    "company_id": str(company_id),
                    "role": str(role),
                    "company_status": company_status,
                    "expires_at": now + _AUTH_CACHE_TTL
                }

                # Periodic cache eviction
                if len(_AUTH_CACHE) > 1000:
                    expired_keys = [k for k, v in _AUTH_CACHE.items() if v["expires_at"] <= now]
                    for k in expired_keys:
                        _AUTH_CACHE.pop(k, None)

            # Check if company workspace is suspended
            if company_status == "suspended" and role != "super_admin":
                return Response(content="Forbidden: Your company workspace has been suspended. Please contact support.", status_code=403)

            # Inject the current company ID and role into contextvars, supporting workspace override for super admins
            override_company_id = request.headers.get("X-Super-Admin-Override-Company-ID")
            if role == "super_admin" and override_company_id:
                set_current_company_id(str(override_company_id))
                set_super_admin_override_active(True)
                request.state.company_id = str(override_company_id)
                request.state.is_override = True
            else:
                set_current_company_id(str(company_id))
                set_super_admin_override_active(False)
                request.state.company_id = str(company_id)
                request.state.is_override = False

            set_current_user_role(str(role))

            request.state.user = user
            request.state.role = str(role)
        except Exception as e:
            return Response(content=f"Unauthorized: Authentication failed: {str(e)}", status_code=401)

        response = await call_next(request)
        return response

app = FastAPI(
    title="Catalyst CRM API",
    description="AI-Native CRM backend featuring dynamic segments, RAG memory, and LangGraph agent flows.",
    version="1.0.0"
)

app.add_middleware(TenantMiddleware)

# Set up CORS middleware to support Next.js frontend calls (outermost middleware to wrap all responses & errors)
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://catalyst-crmagent.vercel.app",
]
if settings.CORS_ORIGINS:
    cors_origins.extend([orig.strip() for orig in settings.CORS_ORIGINS.split(",") if orig.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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
app.include_router(auth.router)
app.include_router(onboard.router)
app.include_router(api_settings.router)
app.include_router(super_admin.router)
app.include_router(digital_twin.router)
app.include_router(chat_studio.router)
app.include_router(contact_sales.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Catalyst CRM Backend API",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    from backend.database.supabase import get_supabase
    try:
        get_supabase().table("customers").select("id").limit(1).execute()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "database": db_status
    }
