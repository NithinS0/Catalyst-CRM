import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from supabase import create_client, Client
from backend.config import settings

from typing import Any
from backend.utils.tenant import get_current_company_id, get_current_user_role, get_super_admin_override_active

TENANT_SCOPED_TABLES = {
    "customers", "orders", "campaigns", "segments",
    "communications", "communication_events", "agent_logs",
    "memory_documents", "profiles", "company_members",
    "integrations", "audit_logs", "campaign_recipients",
    "customer_digital_twins"
}

# ── Tenant-aware Supabase Client Wrapper ─────────────────────────────────────
class TenantPostgrestBuilder:
    def __init__(self, builder: Any, table_name: str):
        self.builder = builder
        self.table_name = table_name

    def __getattr__(self, name: str) -> Any:
        attr = getattr(self.builder, name)
        if callable(attr):
            def wrapper(*args: Any, **kwargs: Any) -> Any:
                res = attr(*args, **kwargs)
                if hasattr(res, 'execute') or hasattr(res, 'select'):
                    return TenantPostgrestBuilder(res, self.table_name)
                return res
            return wrapper
        return attr

    def select(self, *args: Any, **kwargs: Any) -> 'TenantPostgrestBuilder':
        res = self.builder.select(*args, **kwargs)
        company_id = get_current_company_id()
        role = get_current_user_role()
        # Super Admins bypass tenant isolation unless they have an active override
        if role == "super_admin" and not get_super_admin_override_active():
            return TenantPostgrestBuilder(res, self.table_name)
            
        if company_id and self.table_name in TENANT_SCOPED_TABLES:
            res = res.eq("company_id", company_id)
        return TenantPostgrestBuilder(res, self.table_name)

    def update(self, *args: Any, **kwargs: Any) -> 'TenantPostgrestBuilder':
        res = self.builder.update(*args, **kwargs)
        company_id = get_current_company_id()
        role = get_current_user_role()
        if role == "super_admin" and not get_super_admin_override_active():
            return TenantPostgrestBuilder(res, self.table_name)
            
        if company_id and self.table_name in TENANT_SCOPED_TABLES:
            res = res.eq("company_id", company_id)
        return TenantPostgrestBuilder(res, self.table_name)

    def delete(self, *args: Any, **kwargs: Any) -> 'TenantPostgrestBuilder':
        res = self.builder.delete(*args, **kwargs)
        company_id = get_current_company_id()
        role = get_current_user_role()
        if role == "super_admin" and not get_super_admin_override_active():
            return TenantPostgrestBuilder(res, self.table_name)
            
        if company_id and self.table_name in TENANT_SCOPED_TABLES:
            res = res.eq("company_id", company_id)
        return TenantPostgrestBuilder(res, self.table_name)

    def insert(self, json: Any, *args: Any, **kwargs: Any) -> 'TenantPostgrestBuilder':
        company_id = get_current_company_id()
        role = get_current_user_role()
        is_override = get_super_admin_override_active()
        if (role != "super_admin" or is_override) and company_id and self.table_name in TENANT_SCOPED_TABLES:
            if isinstance(json, dict):
                if "company_id" not in json:
                    json = {**json, "company_id": company_id}
            elif isinstance(json, list):
                json = [{**v, "company_id": company_id} if "company_id" not in v else v for v in json]
        res = self.builder.insert(json, *args, **kwargs)
        return TenantPostgrestBuilder(res, self.table_name)

# ── Supabase REST client (used for simple CRUD over HTTPS port 443) ──────────
_supabase_client: Client = None

def reset_supabase_client():
    """Reset the cached Supabase client so a fresh HTTP connection pool is created."""
    global _supabase_client
    if _supabase_client is not None:
        try:
            if hasattr(_supabase_client, 'postgrest') and hasattr(_supabase_client.postgrest, 'session'):
                _supabase_client.postgrest.session.close()
        except Exception:
            pass
    _supabase_client = None

def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        import httpx
        from supabase.lib.client_options import SyncClientOptions

        # Force HTTP/1.1 to avoid HTTP/2 stream multiplexing drops (<ConnectionTerminated error_code:1>)
        http_client = httpx.Client(
            http2=False,
            timeout=httpx.Timeout(60.0, connect=15.0),
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=30.0)
        )
        opts = SyncClientOptions(httpx_client=http_client)
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY, options=opts)
        
        # Override the table method of the client instance to wrap PostgREST builder calls
        original_table = client.table
        def tenant_table(table_name: str) -> Any:
            builder = original_table(table_name)
            return TenantPostgrestBuilder(builder, table_name)
            
        client.table = tenant_table
        _supabase_client = client
    return _supabase_client

# ── psycopg2 connection pool (used for complex SQL / pgvector queries) ────────
_db_pool = None

def get_db_pool():
    global _db_pool
    if _db_pool is None or getattr(_db_pool, 'closed', False):
        from psycopg2.pool import ThreadedConnectionPool
        _db_pool = ThreadedConnectionPool(
            minconn=2,
            maxconn=15,
            dsn=settings.DATABASE_URL,
            cursor_factory=RealDictCursor
        )
    return _db_pool

@contextmanager
def get_db_connection():
    """Borrow a persistent connection from the pool to avoid per-query TCP/TLS handshake latency."""
    pool = get_db_pool()
    conn = None
    try:
        conn = pool.getconn()
        # Check connection health; if disconnected, recreate
        if conn.closed:
            pool.putconn(conn, close=True)
            conn = pool.getconn()
        yield conn
        conn.commit()
    except Exception:
        if conn and not conn.closed:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    finally:
        if conn and not conn.closed:
            try:
                pool.putconn(conn)
            except Exception:
                pass

@contextmanager
def get_db_cursor():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            yield cur

def execute_query(query: str, params: tuple = None):
    with get_db_cursor() as cur:
        cur.execute(query, params or ())
        try:
            return [dict(row) for row in cur.fetchall()]
        except psycopg2.ProgrammingError:
            return None

def execute_insert(query: str, params: tuple = None):
    with get_db_cursor() as cur:
        cur.execute(query, params or ())
        try:
            row = cur.fetchone()
            return dict(row) if row else None
        except psycopg2.ProgrammingError:
            return None
