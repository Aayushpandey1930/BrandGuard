import { useState } from "react";
import type { Finding, FindingStatus } from "../types";

const CATEGORY_COLORS: Record<string, string> = {
  "Terminology": "#0369a1",
  "Fact accuracy": "#7c3aed",
  "Claims & compliance": "#dc2626",
  "Brand voice": "#0f766e",
};

function severityLabel(severity: string) {
  if (severity === "needs_attention") return "Needs attention";
  return "Review";
}

function SuggestionEditor({ suggestion, onApply, onCancel }: {
  suggestion: string;
  onApply: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(suggestion);
  return (
    <div className="mt-2">
      <label htmlFor="suggestion-edit" className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        Edit before applying (optional)
      </label>
      <textarea
        id="suggestion-edit"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}
        aria-label="Edit suggested replacement"
      />
      <div className="flex gap-2 mt-2">
        <button className="btn btn-primary btn-sm" onClick={() => onApply(text)}>
          Apply this text
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function FindingCard({ finding, onUpdate }: {
  finding: Finding;
  onUpdate: (id: string, status: FindingStatus, text?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const isDismissed = finding.status === "dismissed";
  const isResolved = finding.status === "accepted" || finding.status === "edited";
  const catColor = CATEGORY_COLORS[finding.category] ?? "#5c5852";

  let borderColor = "var(--color-border)";
  let bgColor = "var(--color-surface)";
  if (isDismissed) {
    bgColor = "var(--color-dismissed-bg)";
  } else if (isResolved) {
    bgColor = "var(--color-accepted-bg)";
    borderColor = "#bbf7d0";
  } else if (finding.severity === "needs_attention") {
    borderColor = "#fca5a5";
  } else {
    borderColor = "#fbbf24";
  }

  return (
    <div
      className="card"
      style={{ borderColor, background: bgColor, opacity: isDismissed ? 0.65 : 1 }}
      aria-label={`Finding: ${finding.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2" style={{ flexWrap: "wrap" }}>
        <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
          <span
            className="badge"
            style={{
              background: catColor + "18",
              color: catColor,
              border: `1px solid ${catColor}40`,
              fontSize: "0.7rem",
            }}
          >
            {finding.category}
          </span>
          <span className={`badge badge-${finding.severity === "needs_attention" ? "needs-attention" : "review"}`}>
            {severityLabel(finding.severity)}
          </span>
          <span className={`badge badge-${finding.source}`}>
            {finding.source === "ai" ? "AI-assisted" : "Rule check"}
          </span>
          {isResolved && (
            <span className="badge badge-accepted">
              {finding.status === "accepted" ? "Accepted" : "Edited"}
            </span>
          )}
          {isDismissed && (
            <span className="badge badge-dismissed">Dismissed</span>
          )}
        </div>
      </div>

      <h3 className="mt-2 mb-1">{finding.title}</h3>

      {/* Triggered text */}
      <div
        className="mt-1 mb-2"
        style={{
          background: finding.severity === "needs_attention" ? "#fef2f2" : "#fffbeb",
          border: `1px solid ${finding.severity === "needs_attention" ? "#fecaca" : "#fde68a"}`,
          borderRadius: "var(--radius-sm)",
          padding: "0.4rem 0.65rem",
          fontSize: "0.875rem",
          fontStyle: "italic",
          color: "var(--color-text)",
        }}
      >
        "{finding.triggered_text}"
      </div>

      <p className="text-sm text-secondary mb-2">{finding.explanation}</p>

      {/* Related rule */}
      <div style={{ borderLeft: "3px solid var(--color-border-strong)", paddingLeft: "0.75rem", marginBottom: "0.75rem" }}>
        <p className="text-xs text-muted">
          <strong>Related rule:</strong> {finding.related_rule}
        </p>
      </div>

      {/* Confidence note */}
      {finding.confidence_note && (
        <p className="text-xs text-muted mb-2" style={{ fontStyle: "italic" }}>
          ℹ️ {finding.confidence_note}
        </p>
      )}

      {/* Suggestion */}
      {finding.suggestion && !isResolved && !isDismissed && (
        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "var(--radius-sm)",
            padding: "0.5rem 0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <p className="text-xs" style={{ color: "#0369a1", fontWeight: 600, marginBottom: "0.25rem" }}>Suggestion</p>
          <p className="text-sm" style={{ color: "var(--color-text)" }}>
            {finding.suggestion.length > 200
              ? finding.suggestion.slice(0, 200) + "…"
              : finding.suggestion}
          </p>
        </div>
      )}

      {/* Applied text (after edit) */}
      {finding.status === "edited" && finding.applied_text && (
        <div style={{ background: "var(--color-accepted-bg)", border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)", padding: "0.5rem 0.75rem", marginBottom: "0.75rem" }}>
          <p className="text-xs" style={{ color: "var(--color-accepted-border)", fontWeight: 600, marginBottom: "0.25rem" }}>Applied text</p>
          <p className="text-sm">{finding.applied_text}</p>
        </div>
      )}

      {/* Edit interface */}
      {editing && finding.suggestion && (
        <SuggestionEditor
          suggestion={finding.suggestion}
          onApply={(text) => {
            setEditing(false);
            onUpdate(finding.id, "edited", text);
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Actions */}
      {!isResolved && !isDismissed && !editing && (
        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
          {finding.suggestion && (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onUpdate(finding.id, "accepted")}
              >
                Accept suggestion
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setEditing(true)}
              >
                Edit before applying
              </button>
            </>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onUpdate(finding.id, "dismissed")}
            style={{ marginLeft: "auto" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Undo dismiss */}
      {isDismissed && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onUpdate(finding.id, "open")}
        >
          Reopen
        </button>
      )}
    </div>
  );
}

export default function FindingsPanel({ findings, onUpdateFinding }: {
  findings: Finding[];
  onUpdateFinding: (id: string, status: FindingStatus, text?: string) => void;
}) {
  const open = findings.filter((f) => f.status === "open");
  const resolved = findings.filter((f) => f.status !== "open");

  if (findings.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</div>
          <h2>No issues found</h2>
          <p className="text-secondary mt-2 text-sm">All rule-based checks passed. This draft looks consistent with the brand profile.</p>
          <p className="text-xs text-muted mt-2">This does not guarantee publication readiness — a human reviewer should still read the final copy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {open.length > 0 && (
        <>
          <h3 className="text-sm text-secondary" style={{ paddingLeft: "0.25rem" }}>
            Open findings ({open.length})
          </h3>
          {open.map((f) => (
            <FindingCard key={f.id} finding={f} onUpdate={onUpdateFinding} />
          ))}
        </>
      )}
      {resolved.length > 0 && (
        <>
          <h3 className="text-sm text-secondary mt-2" style={{ paddingLeft: "0.25rem" }}>
            Addressed ({resolved.length})
          </h3>
          {resolved.map((f) => (
            <FindingCard key={f.id} finding={f} onUpdate={onUpdateFinding} />
          ))}
        </>
      )}
    </div>
  );
}
