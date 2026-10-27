"""Pydantic models for BrandGuard API."""

from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class Severity(str, Enum):
    review = "review"
    needs_attention = "needs_attention"


class FindingSource(str, Enum):
    rule = "rule"
    ai = "ai"


class FindingStatus(str, Enum):
    open = "open"
    accepted = "accepted"
    edited = "edited"
    dismissed = "dismissed"


class Finding(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    title: str
    category: str
    triggered_text: str
    explanation: str
    related_rule: str
    severity: Severity
    source: FindingSource
    suggestion: Optional[str] = None
    confidence_note: Optional[str] = None
    status: FindingStatus = FindingStatus.open
    applied_text: Optional[str] = None  # text after user edits


class CheckRequest(BaseModel):
    draft: str
    is_sample: bool = False


class ReviewDecision(str, Enum):
    approve = "approve"
    request_changes = "request_changes"


class ActivityEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    type: str  # submitted, finding_accepted, finding_edited, finding_dismissed, comment_added, approved, changes_requested
    description: str
    detail: Optional[str] = None


class ReviewSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:12])
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    draft: str
    is_sample: bool
    findings: list[Finding] = []
    ai_available: bool = False
    comment: Optional[str] = None
    decision: Optional[ReviewDecision] = None
    activity: list[ActivityEvent] = []
    final_status: Optional[str] = None


class CheckResponse(BaseModel):
    session_id: str
    findings: list[Finding]
    ai_available: bool
    summary: str


class UpdateFindingRequest(BaseModel):
    status: FindingStatus
    applied_text: Optional[str] = None


class SubmitReviewRequest(BaseModel):
    session_id: str
    comment: Optional[str] = None
    decision: ReviewDecision


class SessionResponse(BaseModel):
    session: ReviewSession
