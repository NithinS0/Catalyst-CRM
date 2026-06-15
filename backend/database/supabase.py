import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager
from backend.config import settings

# Initialize connection pool for PostgreSQL (Supabase uses Postgres)
db_pool = None

def get_db_pool():
    global db_pool
    if db_pool is None:
        try:
            db_pool = SimpleConnectionPool(
                1, 20,
                dsn=settings.DATABASE_URL
            )
        except Exception as e:
            print(f"Error creating connection pool: {e}")
            # Fallback connection pool with local development default
            fallback_dsn = "postgresql://postgres:postgrespassword@localhost:54322/supabase_local"
            try:
                db_pool = SimpleConnectionPool(1, 20, dsn=fallback_dsn)
            except Exception as fe:
                print(f"Fallback connection pool also failed: {fe}")
                raise fe
    return db_pool

@contextmanager
def get_db_connection():
    pool = get_db_pool()
    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)

@contextmanager
def get_db_cursor():
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur
            conn.commit()

def execute_query(query: str, params: tuple = None):
    with get_db_cursor() as cur:
        cur.execute(query, params or ())
        try:
            return cur.fetchall()
        except psycopg2.ProgrammingError:
            return None

def execute_insert(query: str, params: tuple = None):
    with get_db_cursor() as cur:
        cur.execute(query, params or ())
        try:
            return cur.fetchone()
        except psycopg2.ProgrammingError:
            return None
