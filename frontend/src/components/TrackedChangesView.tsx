/**
 * TrackedChangesView — Round 3 improvement #3
 *
 * Shows the original draft side-by-side with an annotated version.
 * Accepted/edited findings are highlighted green; dismissed findings
 * are struck through. Open findings are underlined in amber.
 *
 * Pure computation — no library required.
 */

import type { Finding } from "../types";

interface Span {
  text: string;
  kind: "normal" | "accepted" | "edited" | "dismissed" | "open";
  findingId?: string;
  replacement?: string; // for accepted/edited spans
}

/** Build annotated spans from draft + findings (longest-match-wins). */
function buildAnnotatedSpans(draft: string, findings: Finding[]): Span[] {
  // Collect all match positions
  type Match = { start: number; end: number; finding: Finding };
  const matches: Match[] = [];

  for (const finding of findings) {
    // We only highlight if there's triggered text that can be located
    const phrase = finding.triggered_text
      .replace(/^…/, "")
      .replace(/…$/, "")
      .trim();
    if (!phrase) continue;
    const idx = draft.indexOf(phrase);
    if (idx === -1) continue;
    matches.push({ start: idx, end: idx + phrase.length, finding });
  }

  // Sort by start, resolve overlaps (first wins)
  matches.sort((a, b) => a.start - b.start);
  const used: Match[] = [];
  for (const m of matches) {
    const last = used[used.length - 1];
    if (!last || m.start >= last.end) {
      used.push(m);
    }
  }

  // Build spans
  const spans: Span[] = [];
  let cursor = 0;

  for (const m of used) {
    if (cursor < m.start) {
      spans.push({ text: draft.slice(cursor, m.start), kind: "normal" });
    }
    const f = m.finding;
    let kind: Span["kind"] = "open";
    if (f.status === "accepted") kind = "accepted";
    else if (f.status === "edited") kind = "edited";
    else if (f.status === "dismissed") kind = "dismissed";

    spans.push({
      text: draft.slice(m.start, m.end),
      kind,
      findingId: f.id,
      replacement: f.status === "edited" ? f.applied_text : undefined,
    });
    cursor = m.end;
  }

  if (cursor < draft.length) {
    spans.push({ text: draft.slice(cursor), kind: "normal" });
  }

  return spans;
}

const SPAN_STYLES: Record<Span["kind"], React.CSSProperties> = {
  normal: {},
  open: {
    background: "#fffbeb",
    borderBottom: "2px solid #f59e0b",
    cursor: "help",
  },
  accepted: {
    background: "#dcfce7",
    color: "#14532d",
    borderRadius: "2px",
    textDecoration: "none",
  },
  edited: {
    background: "#dbeafe",
    color: "#1e3a5f",
    borderRadius: "2px",
  },
  dismissed: {
    textDecoration: "line-through",
    color: "#9ca3af",
  },
};

function AnnotatedDraft({ draft, findings }: { draft: string; findings: Finding[] }) {
  const spans = buildAnnotatedSpans(draft, findings);

  return (
    <p
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontSize: "0.9375rem",
        lineHeight: 1.8,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {spans.map((span, i) => {
        if (span.kind === "normal") {
          return <span key={i}>{span.text}</span>;
        }

        const finding = findings.find((f) => f.id === span.findingId);
        const title = finding?.title ?? "";

        return (
          <span key={i}>
            <span
              style={SPAN_STYLES[span.kind]}
              title={title}
              aria-label={title}
            >
              {span.text}
            </span>
            {/* Show inline replacement for accepted/edited */}
            {(span.kind === "accepted" || span.kind === "edited") && (
              <span
                style={{
                  marginLeft: "0.25rem",
                  background: span.kind === "edited" ? "#bfdbfe" : "#bbf7d0",
                  color: span.kind === "edited" ? "#1e40af" : "#166534",
                  borderRadius: "3px",
                  padding: "0 0.25rem",
                  fontSize: "0.8125rem",
                  fontStyle: "italic",
                  verticalAlign: "middle",
                }}
              >
                {span.kind === "accepted"
                  ? `→ ${finding?.suggestion?.slice(0, 60) ?? "accepted"}`
                  : `→ ${span.replacement?.slice(0, 60) ?? "edited"}`}
              </span>
            )}
          </span>
        );
      })}
    </p>
  );
}

export default function TrackedChangesView({
  draft,
  findings,
}: {
  draft: string;
  findings: Finding[];
}) {
  const hasAnyAnnotation = findings.some((f) => f.status !== "open");
  const accepted = findings.filter((f) => f.status === "accepted" || f.status === "edited").length;
  const dismissed = findings.filter((f) => f.status === "dismissed").length;
  const open = findings.filter((f) => f.status === "open").length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ fontSize: "1rem" }}>Tracked changes</h2>
        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
          {accepted > 0 && (
            <span className="badge" style={{ background: "#dcfce7", color: "#14532d", border: "1px solid #bbf7d0", fontSize: "0.7rem" }}>
              ✓ {accepted} applied
            </span>
          )}
          {dismissed > 0 && (
            <span className="badge" style={{ background: "#f5f5f5", color: "#737373", border: "1px solid #e5e5e5", fontSize: "0.7rem" }}>
              ✕ {dismissed} dismissed
            </span>
          )}
          {open > 0 && (
            <span className="badge badge-review" style={{ fontSize: "0.7rem" }}>
              {open} open
            </span>
          )}
        </div>
      </div>

      {!hasAnyAnnotation && findings.length > 0 && (
        <p className="text-xs text-muted mb-3">
          Accept, edit or dismiss findings in the panel above to see tracked changes here.
        </p>
      )}

      {findings.length === 0 && (
        <p className="text-xs text-muted mb-3">
          No findings — the draft is shown as-is.
        </p>
      )}

      {/* Legend */}
      <div className="flex gap-3 mb-3" style={{ flexWrap: "wrap" }}>
        <span className="text-xs" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ background: "#dcfce7", borderRadius: 3, padding: "0 0.25rem", color: "#14532d" }}>text</span>
          Accepted
        </span>
        <span className="text-xs" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ background: "#dbeafe", borderRadius: 3, padding: "0 0.25rem", color: "#1e3a5f" }}>text</span>
          Edited
        </span>
        <span className="text-xs" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ textDecoration: "line-through", color: "#9ca3af" }}>text</span>
          Dismissed
        </span>
        <span className="text-xs" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ background: "#fffbeb", borderBottom: "2px solid #f59e0b", padding: "0 0.25rem" }}>text</span>
          Open finding
        </span>
      </div>

      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          padding: "1rem 1.25rem",
          background: "var(--color-bg)",
          minHeight: "6rem",
        }}
      >
        <AnnotatedDraft draft={draft} findings={findings} />
      </div>

      <p className="text-xs text-muted mt-2">
        Hover any highlighted span to see the related finding. This view is for reference only — it does not modify the original draft.
      </p>
    </div>
  );
}
