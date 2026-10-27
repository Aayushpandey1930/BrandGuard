# BrandGuard

A focused content review tool for checking drafts against brand guidelines.

Built for a hackathon MVP — clear scope, working demo, no unnecessary complexity.

> **Fictional demo content.** The organisation, brand profile and sample draft are entirely made up and for demonstration purposes only.

---

## What it does

BrandGuard checks a piece of copy against a small set of brand rules for a fictional company called **Northstar Coffee**. It flags possible issues, explains why each one was flagged, and lets a reviewer accept, edit or dismiss suggestions before making a final Approve or Request changes decision.

**Checks included:**

| Check | How it works |
|---|---|
| Preferred terminology | Flags "café/cafe"; suggests "coffee shop" |
| Fact accuracy — location count | Flags any number other than 12 before a location keyword |
| Fact accuracy — seasonal blend | Flags mentions of the seasonal blend without "while supplies last" |
| Claims & compliance | Flags "best in the city" and similar unsupported superlatives |
| Tone analysis | Optional — requires an OpenAI API key on the backend (see below) |

---

## How to run

### Frontend only (no Python required)

All rule-based checks run in the browser. This is the default mode.

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

Click **"Try sample review"** to run through the complete workflow in about a minute.

### With the optional FastAPI backend (adds AI tone analysis)

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
# Add your OPENAI_API_KEY to .env

uvicorn main:app --reload --port 8000
```

Then enable the proxy in `frontend/vite.config.ts` (uncomment the `proxy` block) and update `frontend/src/api.ts` to use `/api` instead of `http://localhost:8000/api`.

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

1. Open http://localhost:5173
2. Click **"Try sample review"** — this loads a draft with several intentional issues
3. Click **"Check draft"**
4. Review the findings panel — you'll see issues about terminology, location count, and an unsupported claim
5. Click **"Accept suggestion"**, **"Edit before applying"**, or **"Dismiss"** on each finding
6. Click **"Add comment and decide →"**
7. Optionally add a reviewer comment
8. Click **"✓ Approve"** or **"↩ Request changes"**
9. The final status and activity history appear

---

## Project structure

```
brandguard/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── brandRules.ts     # Brand profile data (edit this to change rules)
│   │   ├── checker.ts        # Deterministic rule-based checks
│   │   ├── types.ts          # Shared TypeScript types
│   │   ├── App.tsx           # Main app + routing state
│   │   └── components/
│   │       ├── BrandProfilePanel.tsx
│   │       ├── DraftEditor.tsx
│   │       ├── FindingsPanel.tsx
│   │       ├── ReviewDecisionPanel.tsx
│   │       ├── ActivityHistory.tsx
│   │       └── StatusBanner.tsx
│   └── package.json
│
├── backend/                  # Optional FastAPI backend (Python)
│   ├── main.py               # FastAPI app
│   ├── brand_rules.py        # Brand profile (Python)
│   ├── checker.py            # Rule-based checks
│   ├── ai_checker.py         # Optional AI tone analysis
│   ├── models.py             # Pydantic models
│   ├── storage.py            # JSON file storage
│   └── requirements.txt
│
└── README.md
```

---

## Deployment

### Frontend (Vercel / Netlify / GitHub Pages)

```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

For Vercel: connect the GitHub repo and set the root to `frontend/`.

### Backend (optional, for AI tone features)

Deploy to any Python host (Railway, Render, Fly.io). Set `OPENAI_API_KEY` as an environment variable in the host's dashboard — never commit it to the repository.

Update the `BASE` URL in `frontend/src/api.ts` to point to your deployed backend.

---

## Known limitations

- **Session state is in memory.** Refreshing the page resets the session. A database or localStorage persistence would be needed for multi-session use.
- **No authentication.** This is a single-user demo. Adding login would require a separate auth service.
- **Rule-based checks are keyword/regex based.** They can have false positives if language is ambiguous. Each finding is explicitly labelled as needing human review.
- **AI tone analysis is optional.** Without it, tone issues are not detected. The UI clearly states when it is unavailable.
- **No real data is stored.** The backend writes to a local `sessions.json` file. This is not suitable for production.
- **Draft limit is 5,000 characters.** Long documents would need chunking.

---

## Three improvements for Round 3

1. **Persistent sessions with a real database** — Replace the JSON file with SQLite or PostgreSQL so sessions survive restarts and support multiple users.
2. **Custom brand profile upload** — Let teams paste or upload their own brand rules as structured JSON. The checker and display components are already separated from the data, making this straightforward.
3. **Inline draft editor with tracked changes** — Show the original draft side-by-side with an annotated version where accepted suggestions are highlighted in green and dismissed findings are struck through, giving writers a clear picture of what changed.

---

*BrandGuard · Hackathon MVP · Fictional demo content*
