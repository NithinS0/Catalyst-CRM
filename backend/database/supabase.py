import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from supabase import create_client, Client
from backend.config import settings

# ── Supabase REST client (used for simple CRUD over HTTPS port 443) ──────────
_supabase_client: Client = None

def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _supabase_client

# ── psycopg2 direct connection (used for complex SQL / pgvector queries) ──────
@contextmanager
def get_db_connection():
    """Create a direct psycopg2 connection per request."""
    conn = psycopg2.connect(dsn=settings.DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

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
