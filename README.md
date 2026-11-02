# BrandGuard

A focused content review tool for checking drafts against brand guidelines.

Built for **We Code Coders Hackathon — Round 3 final submission**.

> **Fictional demo content.** The organisation, brand profile, and sample draft are entirely made up and for demonstration purposes only.

---

## What it does

BrandGuard checks a piece of copy against a brand profile's rules, preferred wording, and approved facts. It flags possible issues, explains why each one was flagged, and lets a reviewer accept, edit, or dismiss suggestions before making a final Approve or Request Changes decision.

### Round 3 improvements delivered

All three improvements committed at Round 2 have been completed:

| # | Improvement | Status |
|---|---|---|
| 1 | **Persistent sessions with SQLite** | ✅ Done — `storage.py` now uses SQLite with WAL mode; sessions survive restarts |
| 2 | **Custom brand profile upload** | ✅ Done — paste JSON or upload a `.json` file; checker uses your rules immediately |
| 3 | **Inline tracked-changes view** | ✅ Done — results screen shows annotated draft with green/blue/struck highlights |

### Checks included

| Check | How it works |
|---|---|
| Preferred terminology | Flags discouraged words; suggests approved alternatives |
| Fact accuracy — number check | Flags any number that doesn't match an approved count |
| Fact accuracy — qualifier | Flags required phrases missing from a mention |
| Claims & compliance | Flags unsupported superlatives and health claims |
| Tone analysis | Optional — requires an OpenAI API key on the backend |

---

## Quick start

### Frontend only (no Python required)

All rule-based checks run in the browser. This is the default mode.

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

1. Click **"Try sample review"** to run through the complete workflow in about a minute.
2. Or click **"Upload brand rules"** to load your own brand profile, then **"Paste my own draft"**.

### With the optional FastAPI backend (adds AI tone analysis + persistent sessions)

> Python 3.11+ required.

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS / Linux

pip install -r requirements.txt

# Copy and edit the example env file
cp .env.example .env
# Add your OPENAI_API_KEY to .env (optional — all rule checks work without it)

uvicorn main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**. Interactive docs at **http://localhost:8000/docs**.

To connect the frontend to the backend, enable the proxy in `frontend/vite.config.ts`
(uncomment the `proxy` block) and update `frontend/src/api.ts` to use `/api`.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Optional | Enables AI tone analysis. Backend only — never in browser code. |

Create a `backend/.env` file:

```
OPENAI_API_KEY=sk-...
```

If this key is not set, the backend still runs and all rule-based checks work. The UI clearly states that tone analysis is unavailable.

---

## Try the sample workflow

1. Open **http://localhost:5173**
2. Click **"Try sample review"** — this loads a draft with several intentional issues
3. Click **"Check draft"**
4. See the **Tracked changes** view — the annotated draft with highlighted spans
5. Review the findings panel — issues about terminology, location count, and an unsupported claim
6. Click **"Accept suggestion"**, **"Edit before applying"**, or **"Dismiss"** on each finding
7. Watch the Tracked changes view update as you action each finding
8. Click **"Add comment and decide →"**
9. Optionally add a reviewer comment
10. Click **"✓ Approve"** or **"↩ Request changes"**
11. The final status and activity history appear

### Try the custom brand profile feature

1. On the home or editing screen, click **"Upload brand rules"**
2. Click **"Load template"** to start from a working example
3. Edit the JSON to match your organisation's rules
4. Click **"Apply brand profile"**
5. The checker, findings, and brand profile panel all use your custom rules

---

## Project structure

```
brandguard/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── brandRules.ts           # Default brand profile (Northstar Coffee demo)
│   │   ├── checker.ts              # Rule-based checks — accepts dynamic profiles
│   │   ├── types.ts                # Shared TypeScript types
│   │   ├── App.tsx                 # Main app + routing state
│   │   └── components/
│   │       ├── BrandProfilePanel.tsx    # Displays active brand profile
│   │       ├── BrandProfileUpload.tsx   # (New R3) Custom JSON upload/paste
│   │       ├── DraftEditor.tsx          # Draft textarea + check button
│   │       ├── FindingsPanel.tsx        # Per-finding cards with actions
│   │       ├── TrackedChangesView.tsx   # (New R3) Annotated draft diff view
│   │       ├── ReviewDecisionPanel.tsx  # Approve / Request changes
│   │       ├── ActivityHistory.tsx      # Audit log
│   │       └── StatusBanner.tsx         # Final decision display
│   └── package.json
│
├── backend/                  # Optional FastAPI backend (Python)
│   ├── main.py               # FastAPI app — health, check, session endpoints
│   ├── brand_rules.py        # Default brand profile (Python)
│   ├── checker.py            # Rule-based checks
│   ├── ai_checker.py         # Optional AI tone analysis
│   ├── models.py             # Pydantic models
│   ├── storage.py            # (Updated R3) SQLite persistent session storage
│   └── requirements.txt
│
└── README.md
```

---

## API reference (backend)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, returns `ai_available` flag |
| `GET` | `/api/brand-profile` | Returns default brand profile + sample draft |
| `POST` | `/api/check` | Submit draft for checking; returns findings + session ID |
| `GET` | `/api/session/{id}` | Load a saved session |
| `PATCH` | `/api/session/{id}/finding/{fid}` | Update a finding status |
| `POST` | `/api/session/{id}/review` | Submit final approve/changes decision |
| `GET` | `/api/sessions` | List recent sessions (SQLite, R3) |
| `DELETE` | `/api/session/{id}` | Delete a session (R3) |

---

## Deployment

### Frontend (Vercel / Netlify / GitHub Pages)

```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

For Vercel: connect the GitHub repo and set the root to `frontend/`.
A `vercel.json` is already included to handle client-side routing.

### Backend (optional, for AI tone features + persistent sessions)

Deploy to any Python host (Railway, Render, Fly.io).

- Set `OPENAI_API_KEY` as an environment variable in the host's dashboard — never commit it to the repository.
- SQLite database (`brandguard.db`) is created automatically in the backend directory on first run.
- For production multi-server deployments, replace SQLite with PostgreSQL (update `storage.py`).
- Update the `BASE` URL in `frontend/src/api.ts` to point to your deployed backend.

---

## Technical architecture

```
Browser (React + Vite)
│
├── checker.ts          Pure TS rules engine — no network needed
│   └── accepts DynamicBrandProfile (built-in or custom uploaded)
│
├── BrandProfileUpload  Parses + validates JSON; updates app state
├── TrackedChangesView  Computes span annotations from findings state
│
└── (optional) FastAPI backend
    ├── checker.py      Python rules engine (mirrors TS logic)
    ├── ai_checker.py   OpenAI tone analysis (graceful fallback)
    └── storage.py      SQLite with WAL journaling (R3 improvement)
```

### Data flow

1. User pastes draft (and optionally uploads brand rules JSON)
2. `runAllChecks(draft, profile)` runs synchronously in the browser
3. Findings are stored in React state (no network call in frontend-only mode)
4. User actions (accept/edit/dismiss) update finding `status` in state
5. `TrackedChangesView` re-renders with new annotations on every state update
6. Final decision is stored in state; activity history is displayed

---

## Known limitations

- **Session state is in browser memory.** Refreshing the page resets the session. The backend SQLite mode persists across refreshes.
- **No authentication.** This is a single-reviewer demo. Adding login would require a separate auth service.
- **Rule-based checks are keyword/regex based.** They can have false positives if language is ambiguous. Each finding is explicitly labelled as needing human review.
- **AI tone analysis is optional.** Without it, tone issues are not detected.
- **Draft limit is 5,000 characters.** Long documents would need chunking.
- **Custom profile rules run in the browser.** The backend does not receive the custom profile; it always uses the default built-in profile.

---

## Testing

### Manual test checklist

| Scenario | Expected result |
|---|---|
| Click "Try sample review" → Check draft | 3–4 findings appear |
| Accept all findings, proceed to decision, approve | "Approved" status shown |
| Dismiss all findings, request changes | "Changes requested" shown |
| Paste empty draft → click Check draft | Button is disabled |
| Paste draft over 5,000 chars | Button disabled, character count turns red |
| Refresh page mid-workflow | Resets to home (by design; use backend for persistence) |
| Upload malformed JSON as brand profile | Error message shown; previous profile unchanged |
| Upload valid brand rules JSON | Profile panel updates; checker uses new rules |
| Check draft with custom profile | Findings reflect custom rules, not Northstar Coffee rules |
| Accept a finding → check Tracked changes | Span turns green with accepted label |
| Dismiss a finding → check Tracked changes | Span shows strikethrough |

### Edge cases handled

- Empty draft — check button is disabled
- Over-limit draft — check button is disabled, char count highlighted
- Draft with zero findings — "No issues found" state shown
- Null/undefined optional profile fields — graceful rendering with fallbacks
- Invalid JSON in brand profile upload — inline error, no crash
- Same action twice (accept → accept again) — finding stays accepted
- Reopen a dismissed finding — Reopen button restores "open" status
- Submitting review form twice — submitting state prevents double-click

---

## Product roadmap

### Near term (next sprint)

1. **Multi-user auth** — OAuth or email/password login so each reviewer has their own session history
2. **Draft version history** — Track multiple revisions of the same document, compare changes over time
3. **Custom profile library** — Save and name multiple brand profiles, switch between them per draft
4. **Export to PDF/Word** — Generate a review report with findings and decision for records
5. **In-browser diff preview** — Show the actual corrected text inline as the writer would see it

### Medium term

6. **Real-time collaboration** — Multiple reviewers can act on the same session simultaneously (WebSocket)
7. **Webhook integration** — Trigger a review automatically when a CMS draft is submitted
8. **Brand rule suggestions** — Use AI to suggest additional rules based on your existing approved content
9. **Analytics dashboard** — Track which rules are triggered most often, which writers need the most guidance
10. **API-first mode** — Let external tools call BrandGuard as a service for automated pre-publication checks

### Long term

11. **Multi-language support** — Detect and check copy in languages other than English
12. **Image/Alt text checker** — Flag missing or inadequate alt text on images using computer vision
13. **Brand voice scoring** — Quantify how closely a draft matches the defined tone, not just flag violations
14. **Integration marketplace** — Native plugins for Contentful, WordPress, HubSpot, Figma

---

## Features built

### Core (Round 1 & 2)

- ✅ Draft textarea with 5,000-character limit and live character count
- ✅ Sample draft with intentional issues for demonstration
- ✅ Deterministic rule-based checks (terminology, fact accuracy, claims)
- ✅ Finding cards with severity badges (Review / Needs attention)
- ✅ Accept suggestion — one-click apply
- ✅ Edit before applying — inline textarea with custom replacement
- ✅ Dismiss finding — with Reopen option
- ✅ Brand profile panel showing active rules
- ✅ Activity history / audit log with timestamps
- ✅ Approve / Request changes final decision
- ✅ Final status banner (Approved / Changes requested)
- ✅ Responsive layout (mobile-friendly)
- ✅ Accessible — ARIA labels, keyboard navigation, focus management
- ✅ Optional FastAPI backend with OpenAI tone analysis
- ✅ CORS configured for local development

### Round 3 additions

- ✅ **SQLite persistent sessions** — backend storage survives restarts; WAL mode for concurrency
- ✅ **Session list endpoint** — `GET /api/sessions` returns recent sessions with previews
- ✅ **Session delete endpoint** — `DELETE /api/session/{id}`
- ✅ **Custom brand profile upload** — paste JSON or upload `.json` file; validated before use
- ✅ **Brand profile template** — one-click starter template in the upload UI
- ✅ **Dynamic checker** — all rule checks accept the active profile as a parameter
- ✅ **Tracked changes view** — annotated draft showing green accepted, blue edited, struck dismissed, amber open findings
- ✅ **Live tracked changes** — annotations update in real time as findings are actioned
- ✅ **Custom profile reflected in header** — tagline shows active organisation name

---

*BrandGuard · We Code Coders Hackathon Round 3 · Fictional demo content*
