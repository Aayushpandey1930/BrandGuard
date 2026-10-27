"""
Optional AI-assisted tone analysis.
Returns findings only when OPENAI_API_KEY is set.
Clearly indicates when AI is not available — does not fake results.
"""

from __future__ import annotations

import os
from models import Finding, Severity, FindingSource


def is_ai_available() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


def get_tone_findings(draft: str) -> list[Finding]:
    """
    Call OpenAI to check tone against Northstar Coffee voice guidelines.
    Returns an empty list if the API key is not available.
    """
    if not is_ai_available():
        return []

    try:
        from openai import OpenAI
        client = OpenAI()

        system_prompt = """You are a brand voice reviewer for Northstar Coffee. 
The brand voice is: warm, clear and confident. Avoid exaggerated or pushy language.

Review the following draft and identify any specific sentences that:
1. Sound pushy, salesy or use exaggerated language
2. Are unclear or confusing
3. Lack warmth or sound corporate/cold

For each issue found, respond with a JSON array where each item has:
- "triggered_text": the exact problematic sentence or phrase (short excerpt)
- "explanation": a plain-language explanation of the tone issue (1-2 sentences)
- "suggestion": a specific rewrite suggestion

Return only the JSON array. If there are no tone issues, return [].
Limit to at most 2 findings to avoid overwhelming the user."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Draft to review:\n\n{draft}"},
            ],
            temperature=0.2,
            max_tokens=600,
        )

        import json
        raw = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)

        items = json.loads(raw)
        findings = []
        for item in items:
            findings.append(Finding(
                title="Tone concern",
                category="Brand voice",
                triggered_text=item.get("triggered_text", ""),
                explanation=item.get("explanation", ""),
                related_rule="Voice: warm, clear and confident; avoid exaggerated or pushy language.",
                severity=Severity.review,
                source=FindingSource.ai,
                suggestion=item.get("suggestion"),
                confidence_note="AI-assisted — needs human review to confirm.",
            ))
        return findings

    except Exception as e:
        # AI call failed; log and return empty rather than crashing
        print(f"[ai_checker] AI tone check failed: {e}")
        return []


# Avoid circular import in case re module was not imported at top
import re
