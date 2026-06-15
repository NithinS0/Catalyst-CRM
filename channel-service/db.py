import sqlite3
import json
import os
from typing import Optional, List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "channel_service.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Idempotency Keys table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS idempotency_keys (
                key TEXT PRIMARY KEY,
                response_body TEXT NOT NULL,
                status_code INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Local Event History table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                communication_id TEXT NOT NULL,
                recipient TEXT NOT NULL,
                channel TEXT NOT NULL,
                message TEXT NOT NULL,
                event_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Dead-Letter Queue table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dead_letter_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                communication_id TEXT NOT NULL,
                recipient TEXT NOT NULL,
                channel TEXT NOT NULL,
                message TEXT NOT NULL,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                error_message TEXT NOT NULL,
                attempts INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()

def get_cached_response(key: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT response_body, status_code FROM idempotency_keys WHERE key = ?;", (key,))
        row = cursor.fetchone()
        if row:
            return {
                "response_body": json.loads(row["response_body"]),
                "status_code": row["status_code"]
            }
    return None

def cache_response(key: str, response_body: Dict[str, Any], status_code: int):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO idempotency_keys (key, response_body, status_code) VALUES (?, ?, ?);",
            (key, json.dumps(response_body), status_code)
        )
        conn.commit()

def log_event(communication_id: str, recipient: str, channel: str, message: str, event_type: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO events_history (communication_id, recipient, channel, message, event_type)
            VALUES (?, ?, ?, ?, ?);
            """,
            (communication_id, recipient, channel, message, event_type)
        )
        conn.commit()

def insert_dlq(communication_id: str, recipient: str, channel: str, message: str, event_type: str, payload: Dict[str, Any], error_message: str, attempts: int):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO dead_letter_queue (communication_id, recipient, channel, message, event_type, payload, error_message, attempts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (communication_id, recipient, channel, message, event_type, json.dumps(payload), error_message, attempts)
        )
        conn.commit()

def get_events(limit: int = 100) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events_history ORDER BY id DESC LIMIT ?;", (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_dlq(limit: int = 100) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM dead_letter_queue ORDER BY id DESC LIMIT ?;", (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
