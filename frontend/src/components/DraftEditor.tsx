import type { Finding } from "../types";

export default function DraftEditor({ draft, isSample, sampleDraftLabel, onDraftChange, onCheck, isChecking }: {
  draft: string;
  isSample: boolean;
  sampleDraftLabel: string;
  onDraftChange: (v: string) => void;
  onCheck: () => void;
  isChecking: boolean;
}) {
  const charCount = draft.length;
  const maxChars = 5000;
  const isOver = charCount > maxChars;
  const isEmpty = draft.trim().length === 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="draft-input">Draft text</label>
        <span className={`text-xs ${isOver ? "text-muted" : "text-muted"}`} style={{ color: isOver ? "var(--color-needs-text)" : undefined }}>
          {charCount}/{maxChars}
        </span>
      </div>

      {isSample && (
        <div className="notice notice-warn mb-2">
          ℹ️ {sampleDraftLabel}
        </div>
      )}

      <textarea
        id="draft-input"
        rows={10}
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder="Paste your draft here…"
        disabled={isChecking}
        aria-label="Draft text to review"
        aria-describedby="draft-hint"
      />
      <p id="draft-hint" className="text-xs text-muted mt-1">
        The draft will be checked against Northstar Coffee's brand rules.
      </p>

      <div className="flex gap-2 mt-3" style={{ justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary"
          onClick={onCheck}
          disabled={isChecking || isEmpty || isOver}
        >
          {isChecking ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Checking…
            </>
          ) : (
            "Check draft"
          )}
        </button>
      </div>
    </div>
  );
}
