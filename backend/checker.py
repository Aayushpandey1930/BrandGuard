"""
Deterministic rule-based checks against the Northstar Coffee brand profile.
These run without any AI credentials.
"""

from __future__ import annotations

import re
from models import Finding, Severity, FindingSource
from brand_rules import BRAND_PROFILE


def _find_excerpt(text: str, phrase: str, window: int = 80) -> str:
    """Return a short excerpt of text around the first occurrence of phrase."""
    idx = text.lower().find(phrase.lower())
    if idx == -1:
        return phrase
    start = max(0, idx - 20)
    end = min(len(text), idx + len(phrase) + 60)
    excerpt = text[start:end].strip()
    if start > 0:
        excerpt = "…" + excerpt
    if end < len(text):
        excerpt = excerpt + "…"
    return excerpt


def check_preferred_terms(draft: str) -> list[Finding]:
    """Flag use of discouraged terms."""
    findings = []
    for term_rule in BRAND_PROFILE["preferred_terms"]:
        for avoid_word in term_rule["avoid"]:
            pattern = r"\b" + re.escape(avoid_word) + r"\b"
            if re.search(pattern, draft, re.IGNORECASE):
                excerpt = _find_excerpt(draft, avoid_word)
                findings.append(Finding(
                    title=f"Preferred term: use "{term_rule['use']}"",
                    category="Terminology",
                    triggered_text=excerpt,
                    explanation=(
                        f"The word "{avoid_word}" appears in this draft. "
                        f"Northstar Coffee uses "{term_rule['use']}" in all "
                        f"{term_rule['context']} to keep language consistent."
                    ),
                    related_rule=f"Use "{term_rule['use']}" — avoid "{avoid_word}" in {term_rule['context']}. {term_rule['rationale']}",
                    severity=Severity.review,
                    source=FindingSource.rule,
                    suggestion=draft.replace(avoid_word, term_rule["use"]).replace(
                        avoid_word.capitalize(), term_rule["use"].capitalize()
                    ),
                ))
    return findings


def check_approved_facts(draft: str) -> list[Finding]:
    """Flag numbers or claims that contradict approved facts."""
    findings = []

    # Fact: 12 locations
    loc_fact = next(f for f in BRAND_PROFILE["approved_facts"] if f["id"] == "fact_locations")
    # Look for any number followed by location keyword
    loc_pattern = r"\b(\d+)\s+(?:location|locations|store|stores|branch|branches|outlet|outlets)\b"
    match = re.search(loc_pattern, draft, re.IGNORECASE)
    if match:
        found_num = int(match.group(1))
        approved_num = loc_fact["numbers"][0]
        if found_num != approved_num:
            findings.append(Finding(
                title="Incorrect location count",
                category="Fact accuracy",
                triggered_text=_find_excerpt(draft, match.group(0)),
                explanation=(
                    f"The draft says "{match.group(0)}" but the approved fact is "
                    f""{loc_fact['statement']}". Using the wrong number risks "
                    f"misleading customers and undermining trust."
                ),
                related_rule=loc_fact["statement"],
                severity=Severity.needs_attention,
                source=FindingSource.rule,
                suggestion=draft.replace(match.group(0),
                    re.sub(r"\d+", str(approved_num), match.group(0), count=1)),
            ))

    # Fact: seasonal blend availability phrase
    seasonal_fact = next(f for f in BRAND_PROFILE["approved_facts"] if f["id"] == "fact_seasonal_blend")
    seasonal_keywords = ["seasonal blend", "seasonal"]
    for kw in seasonal_keywords:
        if re.search(r"\b" + re.escape(kw) + r"\b", draft, re.IGNORECASE):
            required = seasonal_fact["required_phrase"]
            if required.lower() not in draft.lower():
                excerpt = _find_excerpt(draft, kw)
                findings.append(Finding(
                    title="Missing availability qualifier",
                    category="Fact accuracy",
                    triggered_text=excerpt,
                    explanation=(
                        f"The draft mentions the seasonal blend but does not include "
                        f"the required phrase "{required}". Without this qualifier, "
                        f"customers may expect availability that cannot be guaranteed."
                    ),
                    related_rule=seasonal_fact["statement"],
                    severity=Severity.review,
                    source=FindingSource.rule,
                    suggestion=f"Add "{required}" after the mention of the seasonal blend.",
                    confidence_note="Needs human review — context may already imply limited availability.",
                ))
            break

    return findings


def check_restricted_claims(draft: str) -> list[Finding]:
    """Flag unsupported promotional or health claims."""
    findings = []
    for claim_rule in BRAND_PROFILE["restricted_claims"]:
        for pattern in claim_rule["patterns"]:
            if re.search(re.escape(pattern), draft, re.IGNORECASE):
                excerpt = _find_excerpt(draft, pattern)
                findings.append(Finding(
                    title="Unsupported claim",
                    category="Claims & compliance",
                    triggered_text=excerpt,
                    explanation=(
                        f"The phrase "{pattern}" is a promotional claim that requires "
                        f"documented evidence before it can be published. Using it "
                        f"without approval creates compliance risk."
                    ),
                    related_rule=claim_rule["rule"],
                    severity=Severity(claim_rule["severity"]),
                    source=FindingSource.rule,
                    suggestion="Remove or replace with a specific, verifiable statement. For example, describe a specific award or customer milestone instead.",
                ))
                break  # one finding per claim rule is enough
    return findings


def run_all_rule_checks(draft: str) -> list[Finding]:
    """Run all deterministic checks and return a combined list of findings."""
    findings: list[Finding] = []
    findings.extend(check_preferred_terms(draft))
    findings.extend(check_approved_facts(draft))
    findings.extend(check_restricted_claims(draft))
    return findings
