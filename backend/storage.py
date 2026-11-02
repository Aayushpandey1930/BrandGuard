"""
Persistent storage for BrandGuard review sessions using SQLite.
Replaces the previous JSON-file approach so sessions survive server restarts
and multiple concurrent users are supported without write conflicts.

Round 3 improvement #1: persistent sessions with a real database.
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from models import ReviewSession

DB_PATH = Path(__file__).parent / "brandguard.db"

_DDL = """
CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    created_at  TEXT NOT NULL,
    data        TEXT NOT NULL
);
"""


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # safe for concurrent readers
    conn.execute(_DDL)
    conn.commit()
    return conn


def save_session(session: ReviewSession) -> None:
    conn = _get_conn()
    try:
        payload = session.model_dump_json()
        conn.execute(
            """
            INSERT INTO sessions (id, created_at, data)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = excluded.data
            """,
            (session.id, session.created_at, payload),
        )
        conn.commit()
    finally:
        conn.close()


def load_session(session_id: str) -> ReviewSession | None:
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT data FROM sessions WHERE id = ?", (session_id,)
        ).fetchone()
        if row is None:
            return None
        return ReviewSession.model_validate_json(row["data"])
    finally:
        conn.close()


def list_recent_sessions(limit: int = 20) -> list[ReviewSession]:
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT data FROM sessions ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [ReviewSession.model_validate_json(r["data"]) for r in rows]
    finally:
        conn.close()


def delete_session(session_id: str) -> bool:
    conn = _get_conn()
    try:
        cursor = conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
