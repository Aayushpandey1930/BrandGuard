import { useState } from "react";
import type { Finding, ReviewDecision } from "../types";

export default function ReviewDecisionPanel({ findings, onSubmit }: {
  findings: Finding[];
  onSubmit: (decision: ReviewDecision, comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openCount = findings.filter((f) => f.status === "open").length;
  const needsAttentionOpen = findings.filter((f) => f.status === "open" && f.severity === "needs_attention").length;

  const handleDecision = async (decision: ReviewDecision) => {
    setSubmitting(true);
    await onSubmit(decision, comment);
    setSubmitting(false);
  };

  return (
    <div className="card">
      <h2 className="mb-1">Reviewer decision</h2>
      <p className="text-sm text-secondary mb-4">
        Add a comment and choose how to proceed. This will be recorded in the review history.
      </p>

      {openCount > 0 && (
        <div className={`notice ${needsAttentionOpen > 0 ? "notice-error" : "notice-warn"} mb-4`}>
          {needsAttentionOpen > 0
            ? `${needsAttentionOpen} "Needs attention" finding${needsAttentionOpen !== 1 ? "s" : ""} still open. Consider addressing these before approving.`
            : `${openCount} finding${openCount !== 1 ? "s" : ""} still open. You can still approve, but make a note if you're knowingly leaving these open.`
          }
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="reviewer-comment">Reviewer comment (optional)</label>
        <textarea
          id="reviewer-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add context for your decision, notes for the writer, or anything else relevant…"
          disabled={submitting}
          aria-label="Reviewer comment"
        />
      </div>

      <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
        <button
          className="btn btn-primary"
          onClick={() => handleDecision("approve")}
          disabled={submitting}
          style={{ flex: 1 }}
        >
          {submitting ? <><span className="spinner" aria-hidden="true" /> Submitting…</> : "✓ Approve"}
        </button>
        <button
          className="btn btn-secondary btn-danger"
          onClick={() => handleDecision("request_changes")}
          disabled={submitting}
          style={{ flex: 1, borderColor: "#dc2626", color: "#991b1b" }}
        >
          {submitting ? <><span className="spinner" aria-hidden="true" /> Submitting…</> : "↩ Request changes"}
        </button>
      </div>

      <p className="text-xs text-muted mt-3">
        Both options record your decision and comment. Neither automatically publishes or sends the draft anywhere.
      </p>
    </div>
  );
}
