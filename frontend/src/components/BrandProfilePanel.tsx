import type { BrandProfile } from "../types";

export default function BrandProfilePanel({
  profile,
  compact = false,
}: {
  profile: BrandProfile;
  compact?: boolean;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontSize: compact ? "0.9375rem" : undefined }}>
          Brand profile
        </h2>
        <span
          className="badge"
          style={{
            background: "#f3f4f6",
            color: "#6b7280",
            border: "1px solid #e5e7eb",
            fontSize: "0.7rem",
          }}
        >
          {profile.organisation}
        </span>
      </div>

      <p className="text-xs text-muted mb-3" style={{ fontStyle: "italic" }}>
        {profile.disclaimer}
      </p>

      <section className="mb-3">
        <h3
          className="text-sm mb-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Voice
        </h3>
        <p className="text-sm">{profile.voice.description}</p>
      </section>

      <hr className="divider" style={{ margin: "0.75rem 0" }} />

      <section className="mb-3">
        <h3
          className="text-sm mb-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Terminology
        </h3>
        {profile.preferred_terms.map((t, i) => (
          <p key={i} className="text-sm">
            Use <strong>"{t.use}"</strong> — avoid "
            {[...t.avoid].join('", "')}" in {t.context}.
          </p>
        ))}
      </section>

      <hr className="divider" style={{ margin: "0.75rem 0" }} />

      <section className={compact ? "" : "mb-3"}>
        <h3
          className="text-sm mb-2"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Approved facts
        </h3>
        <ul
          style={{
            paddingLeft: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {profile.approved_facts.map((f) => (
            <li key={f.id} className="text-sm">
              {f.statement}
            </li>
          ))}
        </ul>
      </section>

      {!compact && (
        <>
          <hr className="divider" style={{ margin: "0.75rem 0" }} />
          <section className="mb-3">
            <h3
              className="text-sm mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Claims rules
            </h3>
            <ul
              style={{
                paddingLeft: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              {profile.restricted_claims.map((c) => (
                <li key={c.id} className="text-sm">
                  {c.rule}
                </li>
              ))}
            </ul>
          </section>
          <hr className="divider" style={{ margin: "0.75rem 0" }} />
          <section>
            <h3
              className="text-sm mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Accessibility
            </h3>
            <p className="text-sm">{profile.accessibility.rule}</p>
          </section>
        </>
      )}
    </div>
  );
}
