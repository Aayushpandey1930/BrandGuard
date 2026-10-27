import type { ActivityEvent } from "../types";

const EVENT_ICONS: Record<string, string> = {
  submitted: "📄",
  check_complete: "🔍",
  finding_accepted: "✓",
  finding_edited: "✏️",
  finding_dismissed: "✕",
  comment_added: "💬",
  approved: "✅",
  changes_requested: "↩",
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ActivityHistory({ events, showAll = false }: {
  events: ActivityEvent[];
  showAll?: boolean;
}) {
  const displayed = showAll ? events : events.slice(-5);

  return (
    <div className="card">
      <h3 className="mb-3">Activity</h3>
      {events.length === 0 ? (
        <p className="text-sm text-muted">No activity yet.</p>
      ) : (
        <ol style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {displayed.map((event) => (
            <li key={event.id} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
              <span
                style={{
                  flexShrink: 0,
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "50%",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  marginTop: "0.1rem",
                }}
                aria-hidden="true"
              >
                {EVENT_ICONS[event.type] ?? "•"}
              </span>
              <div style={{ flex: 1 }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm" style={{ fontWeight: 500 }}>{event.description}</p>
                  <span className="text-xs text-muted" style={{ flexShrink: 0 }}>{formatTime(event.timestamp)}</span>
                </div>
                {event.detail && (
                  <p className="text-xs text-muted mt-1" style={{ wordBreak: "break-word" }}>
                    {event.detail.length > 120 ? event.detail.slice(0, 120) + "…" : event.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {!showAll && events.length > 5 && (
        <p className="text-xs text-muted mt-2">Showing last 5 events.</p>
      )}
    </div>
  );
}
