import { useState } from "react";
import { runAllChecks } from "./checker";
import { BRAND_PROFILE, SAMPLE_DRAFT, SAMPLE_DRAFT_LABEL } from "./brandRules";
import type {
  Finding,
  FindingStatus,
  ReviewDecision,
  ActivityEvent,
} from "./types";
import BrandProfilePanel from "./components/BrandProfilePanel";
import DraftEditor from "./components/DraftEditor";
import FindingsPanel from "./components/FindingsPanel";
import ReviewDecisionPanel from "./components/ReviewDecisionPanel";
import ActivityHistory from "./components/ActivityHistory";
import StatusBanner from "./components/StatusBanner";

type AppState = "home" | "editing" | "results" | "decision" | "done";

function makeEvent(type: string, description: string, detail?: string): ActivityEvent {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    type,
    description,
    detail,
  };
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("home");
  const [draft, setDraft] = useState<string>("");
  const [isSample, setIsSample] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [finalStatus, setFinalStatus] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const openCount = findings.filter((f) => f.status === "open").length;
  const totalFindings = findings.length;

  const summary =
    totalFindings === 0
      ? "No issues found — all checks passed."
      : totalFindings === 1
      ? "1 item to review."
      : `${totalFindings} items to review.`;

  const handleUseSample = () => {
    setDraft(SAMPLE_DRAFT);
    setIsSample(true);
    setAppState("editing");
  };

  const handleStartCustom = () => {
    setDraft("");
    setIsSample(false);
    setAppState("editing");
  };

  const handleCheck = async () => {
    if (!draft.trim()) return;
    setIsChecking(true);
    // Small artificial delay so the loading state is visible
    await new Promise((r) => setTimeout(r, 500));
    const results = runAllChecks(draft);
    setFindings(results);
    const events: ActivityEvent[] = [
      makeEvent(
        "submitted",
        "Draft submitted for review",
        `${isSample ? "Sample draft" : "Custom draft"} — ${draft.length} characters`
      ),
      makeEvent(
        "check_complete",
        results.length === 0
          ? "Review complete — no issues found"
          : `Review complete — ${results.length} item${results.length !== 1 ? "s" : ""} to review`,
        `Rule-based checks: ${results.length}; AI-assisted: 0 (not configured)`
      ),
    ];
    setActivity(events);
    setIsChecking(false);
    setAppState("results");
  };

  const handleUpdateFinding = (findingId: string, status: FindingStatus, appliedText?: string) => {
    setFindings((prev) =>
      prev.map((f) =>
        f.id === findingId
          ? { ...f, status, applied_text: appliedText ?? f.applied_text }
          : f
      )
    );
    const finding = findings.find((f) => f.id === findingId);
    if (!finding) return;
    const desc =
      status === "accepted"
        ? `Suggestion accepted: ${finding.title}`
        : status === "edited"
        ? `Suggestion edited and applied: ${finding.title}`
        : `Finding dismissed: ${finding.title}`;
    setActivity((prev) => [
      ...prev,
      makeEvent(`finding_${status}`, desc, appliedText),
    ]);
  };

  const handleSubmitReview = (decision: ReviewDecision, comment: string) => {
    const newActivity: ActivityEvent[] = [];
    if (comment) {
      newActivity.push(makeEvent("comment_added", "Reviewer comment added", comment));
    }
    const status = decision === "approve" ? "Approved" : "Changes requested";
    newActivity.push(
      makeEvent(
        decision === "approve" ? "approved" : "changes_requested",
        decision === "approve" ? "Content approved" : "Changes requested"
      )
    );
    setActivity((prev) => [...prev, ...newActivity]);
    setFinalStatus(status);
    setAppState("done");
  };

  const handleStartOver = () => {
    setAppState("home");
    setDraft("");
    setIsSample(false);
    setFindings([]);
    setActivity([]);
    setFinalStatus(null);
    setIsChecking(false);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          href="/"
          className="app-header-brand"
          onClick={(e) => {
            e.preventDefault();
            handleStartOver();
          }}
          aria-label="BrandGuard — go to home"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 2L3 6v8l7 4 7-4V6L10 2z"
              fill="#2563b0"
              opacity="0.15"
              stroke="#2563b0"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M10 6l-4 2.3V14l4 2.3L14 14V8.3L10 6z" fill="#2563b0" />
          </svg>
          Brand<span>Guard</span>
        </a>
        <span className="app-header-tagline" aria-hidden="true">
          Northstar Coffee · Demo
        </span>
      </header>

      <main className="app-main" id="main-content">
        {appState === "home" && (
          <HomePage
            onUseSample={handleUseSample}
            onStartCustom={handleStartCustom}
          />
        )}

        {appState === "editing" && (
          <EditingView
            draft={draft}
            isSample={isSample}
            onDraftChange={setDraft}
            onCheck={handleCheck}
            onBack={handleStartOver}
            isChecking={isChecking}
          />
        )}

        {appState === "results" && (
          <ResultsView
            findings={findings}
            summary={summary}
            openCount={openCount}
            activity={activity}
            isSample={isSample}
            onUpdateFinding={handleUpdateFinding}
            onProceedToDecision={() => setAppState("decision")}
            onStartOver={handleStartOver}
          />
        )}

        {appState === "decision" && (
          <DecisionView
            findings={findings}
            activity={activity}
            onSubmit={handleSubmitReview}
            onBack={() => setAppState("results")}
          />
        )}

        {appState === "done" && finalStatus && (
          <DoneView
            finalStatus={finalStatus}
            activity={activity}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Page-level view components
// ────────────────────────────────────────────────────────────────────────────

function HomePage({
  onUseSample,
  onStartCustom,
}: {
  onUseSample: () => void;
  onStartCustom: () => void;
}) {
  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>Check a draft before it goes out</h1>
        <p
          className="text-secondary"
          style={{ maxWidth: 560, marginBottom: "1.25rem" }}
        >
          BrandGuard compares your draft against Northstar Coffee's brand rules,
          preferred wording and approved facts. It flags possible issues and
          suggests corrections — you make the final call.
        </p>
        <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={onUseSample}>
            Try sample review
          </button>
          <button className="btn btn-secondary" onClick={onStartCustom}>
            Paste my own draft
          </button>
        </div>
        <p className="text-xs text-muted mt-3">
          ℹ️ {SAMPLE_DRAFT_LABEL}
        </p>
      </div>

      <div className="two-col">
        <BrandProfilePanel profile={BRAND_PROFILE} />
        <div className="card">
          <h2 className="mb-3">How it works</h2>
          <ol
            style={{
              paddingLeft: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            <li className="text-sm text-secondary">Paste a draft or use the sample.</li>
            <li className="text-sm text-secondary">
              BrandGuard checks it against brand rules and approved facts — no
              internet connection or account required.
            </li>
            <li className="text-sm text-secondary">
              Each finding shows what was flagged, why, and which rule it relates
              to.
            </li>
            <li className="text-sm text-secondary">
              Accept a suggestion, edit it first, or dismiss it — your choice.
            </li>
            <li className="text-sm text-secondary">
              Add a comment, then choose Approve or Request changes.
            </li>
          </ol>
          <hr className="divider" />
          <p className="text-xs text-muted">
            All checks run in your browser. No data is sent anywhere.
            Optional AI tone analysis can be added via a backend with an{" "}
            <code>OPENAI_API_KEY</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

function EditingView({
  draft,
  isSample,
  onDraftChange,
  onCheck,
  onBack,
  isChecking,
}: {
  draft: string;
  isSample: boolean;
  onDraftChange: (v: string) => void;
  onCheck: () => void;
  onBack: () => void;
  isChecking: boolean;
}) {
  return (
    <div>
      <div
        className="flex items-center justify-between mb-4"
        style={{ flexWrap: "wrap", gap: "0.5rem" }}
      >
        <h1 style={{ fontSize: "1.25rem" }}>Check a draft</h1>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back
        </button>
      </div>
      <div className="two-col">
        <DraftEditor
          draft={draft}
          isSample={isSample}
          sampleDraftLabel={SAMPLE_DRAFT_LABEL}
          onDraftChange={onDraftChange}
          onCheck={onCheck}
          isChecking={isChecking}
        />
        <BrandProfilePanel profile={BRAND_PROFILE} compact />
      </div>
    </div>
  );
}

function ResultsView({
  findings,
  summary,
  openCount,
  activity,
  isSample,
  onUpdateFinding,
  onProceedToDecision,
  onStartOver,
}: {
  findings: Finding[];
  summary: string;
  openCount: number;
  activity: ActivityEvent[];
  isSample: boolean;
  onUpdateFinding: (id: string, status: FindingStatus, text?: string) => void;
  onProceedToDecision: () => void;
  onStartOver: () => void;
}) {
  return (
    <div>
      <div
        className="flex items-center justify-between mb-4"
        style={{ flexWrap: "wrap", gap: "0.5rem" }}
      >
        <div>
          <h1 style={{ fontSize: "1.25rem" }}>Review findings</h1>
          <p className="text-sm text-secondary mt-1">{summary}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onStartOver}>
          Start over
        </button>
      </div>

      <div className="notice notice-info mb-4">
        <strong>Tone analysis not configured.</strong> Rule-based checks are
        running. To enable AI tone feedback, see the README for backend setup
        with <code>OPENAI_API_KEY</code>.
      </div>

      {isSample && (
        <div className="notice notice-warn mb-4">
          ℹ️ {SAMPLE_DRAFT_LABEL}
        </div>
      )}

      <div className="two-col">
        <FindingsPanel
          findings={findings}
          onUpdateFinding={onUpdateFinding}
        />
        <div className="flex flex-col gap-4">
          <BrandProfilePanel profile={BRAND_PROFILE} compact />
          <ActivityHistory events={activity} />
          <div className="card">
            <h3 className="mb-3">Ready to decide?</h3>
            <p className="text-sm text-secondary mb-3">
              {openCount > 0
                ? `${openCount} finding${openCount !== 1 ? "s" : ""} still open. You can proceed now or address them first.`
                : "All findings addressed. Add a comment and choose a decision."}
            </p>
            <button
              className="btn btn-primary w-full"
              onClick={onProceedToDecision}
            >
              Add comment and decide →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionView({
  findings,
  activity,
  onSubmit,
  onBack,
}: {
  findings: Finding[];
  activity: ActivityEvent[];
  onSubmit: (decision: ReviewDecision, comment: string) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div
        className="flex items-center justify-between mb-4"
        style={{ flexWrap: "wrap", gap: "0.5rem" }}
      >
        <h1 style={{ fontSize: "1.25rem" }}>Make a decision</h1>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back to findings
        </button>
      </div>
      <div className="two-col">
        <ReviewDecisionPanel findings={findings} onSubmit={onSubmit} />
        <ActivityHistory events={activity} />
      </div>
    </div>
  );
}

function DoneView({
  finalStatus,
  activity,
  onStartOver,
}: {
  finalStatus: string;
  activity: ActivityEvent[];
  onStartOver: () => void;
}) {
  const isApproved = finalStatus === "Approved";
  return (
    <div>
      <StatusBanner
        status={finalStatus}
        isApproved={isApproved}
        onStartOver={onStartOver}
      />
      <div className="mt-6">
        <ActivityHistory events={activity} showAll />
      </div>
    </div>
  );
}
