"""
BrandGuard API — FastAPI backend
"""

from __future__ import annotations

import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    CheckRequest,
    CheckResponse,
    Finding,
    FindingStatus,
    ReviewDecision,
    ReviewSession,
    ActivityEvent,
    SessionResponse,
    SubmitReviewRequest,
    UpdateFindingRequest,
)
from brand_rules import BRAND_PROFILE, SAMPLE_DRAFT, SAMPLE_DRAFT_LABEL
from checker import run_all_rule_checks
from ai_checker import get_tone_findings, is_ai_available
import storage

app = FastAPI(title="BrandGuard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health / info
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "ai_available": is_ai_available()}


@app.get("/api/brand-profile")
def get_brand_profile():
    return {
        "profile": BRAND_PROFILE,
        "sample_draft": SAMPLE_DRAFT,
        "sample_draft_label": SAMPLE_DRAFT_LABEL,
    }


# ---------------------------------------------------------------------------
# Check
# ---------------------------------------------------------------------------

@app.post("/api/check", response_model=CheckResponse)
def check_draft(req: CheckRequest):
    draft = req.draft.strip()
    if not draft:
        raise HTTPException(status_code=400, detail="Draft text cannot be empty.")
    if len(draft) > 5000:
        raise HTTPException(status_code=400, detail="Draft must be under 5,000 characters.")

    findings: list[Finding] = run_all_rule_checks(draft)
    ai_findings = get_tone_findings(draft)
    ai_ok = is_ai_available() and len(ai_findings) >= 0  # True even if 0 AI findings returned
    findings.extend(ai_findings)

    # Build activity log
    activity = [
        ActivityEvent(
            type="submitted",
            description="Draft submitted for review",
            detail=f"{'Sample draft' if req.is_sample else 'Custom draft'} — {len(draft)} characters",
        )
    ]
    if findings:
        activity.append(ActivityEvent(
            type="check_complete",
            description=f"Review complete — {len(findings)} item{'s' if len(findings) != 1 else ''} to review",
            detail=f"Rule-based checks: {sum(1 for f in findings if f.source == 'rule')}; AI-assisted: {sum(1 for f in findings if f.source == 'ai')}",
        ))
    else:
        activity.append(ActivityEvent(
            type="check_complete",
            description="Review complete — no issues found",
        ))

    session = ReviewSession(
        draft=draft,
        is_sample=req.is_sample,
        findings=findings,
        ai_available=is_ai_available(),
        activity=activity,
    )
    storage.save_session(session)

    # Summary text
    n = len(findings)
    if n == 0:
        summary = "No issues found — all checks passed."
    elif n == 1:
        summary = "1 item to review."
    else:
        summary = f"{n} items to review."

    return CheckResponse(
        session_id=session.id,
        findings=findings,
        ai_available=is_ai_available(),
        summary=summary,
    )


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------

@app.get("/api/session/{session_id}", response_model=SessionResponse)
def get_session(session_id: str):
    session = storage.load_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")
    return SessionResponse(session=session)


@app.patch("/api/session/{session_id}/finding/{finding_id}")
def update_finding(session_id: str, finding_id: str, req: UpdateFindingRequest):
    session = storage.load_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")

    target = next((f for f in session.findings if f.id == finding_id), None)
    if target is None:
        raise HTTPException(status_code=404, detail="Finding not found.")

    old_status = target.status
    target.status = req.status
    if req.applied_text is not None:
        target.applied_text = req.applied_text

    # Log activity
    if req.status == FindingStatus.accepted:
        session.activity.append(ActivityEvent(
            type="finding_accepted",
            description=f"Suggestion accepted: {target.title}",
        ))
    elif req.status == FindingStatus.edited:
        session.activity.append(ActivityEvent(
            type="finding_edited",
            description=f"Suggestion edited and applied: {target.title}",
            detail=req.applied_text,
        ))
    elif req.status == FindingStatus.dismissed:
        session.activity.append(ActivityEvent(
            type="finding_dismissed",
            description=f"Finding dismissed: {target.title}",
        ))

    storage.save_session(session)
    return {"ok": True, "finding": target}


@app.post("/api/session/{session_id}/review")
def submit_review(session_id: str, req: SubmitReviewRequest):
    session = storage.load_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")

    if req.comment:
        session.comment = req.comment
        session.activity.append(ActivityEvent(
            type="comment_added",
            description="Reviewer comment added",
            detail=req.comment,
        ))

    session.decision = req.decision
    if req.decision == ReviewDecision.approve:
        session.final_status = "Approved"
        session.activity.append(ActivityEvent(
            type="approved",
            description="Content approved",
        ))
    else:
        session.final_status = "Changes requested"
        session.activity.append(ActivityEvent(
            type="changes_requested",
            description="Changes requested",
        ))

    storage.save_session(session)
    return {"ok": True, "final_status": session.final_status, "session": session}
