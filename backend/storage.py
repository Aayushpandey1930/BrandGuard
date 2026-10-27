"""
Simple JSON-file storage for review sessions.
Stores sessions in a local file — suitable for the hackathon MVP.
Data is not encrypted and is lost if the file is deleted.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from models import ReviewSession

STORAGE_FILE = Path(__file__).parent / "sessions.json"


def _load_all() -> dict[str, dict]:
    if not STORAGE_FILE.exists():
        return {}
    try:
        return json.loads(STORAGE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _save_all(data: dict[str, dict]) -> None:
    STORAGE_FILE.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def save_session(session: ReviewSession) -> None:
    data = _load_all()
    data[session.id] = session.model_dump()
    _save_all(data)


def load_session(session_id: str) -> ReviewSession | None:
    data = _load_all()
    raw = data.get(session_id)
    if raw is None:
        return None
    return ReviewSession.model_validate(raw)


def list_recent_sessions(limit: int = 20) -> list[ReviewSession]:
    data = _load_all()
    sessions = [ReviewSession.model_validate(v) for v in data.values()]
    sessions.sort(key=lambda s: s.created_at, reverse=True)
    return sessions[:limit]
