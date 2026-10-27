export default function StatusBanner({ status, isApproved, onStartOver }: {
  status: string;
  isApproved: boolean;
  onStartOver: () => void;
}) {
  return (
    <div
      className="card"
      style={{
        borderColor: isApproved ? "#16a34a" : "#dc2626",
        background: isApproved ? "var(--color-accepted-bg)" : "var(--color-needs-bg)",
        textAlign: "center",
        padding: "2.5rem 2rem",
      }}
    >
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
        {isApproved ? "✅" : "↩"}
      </div>
      <h1
        style={{
          fontSize: "1.5rem",
          color: isApproved ? "#14532d" : "#991b1b",
          marginBottom: "0.5rem",
        }}
      >
        {status}
      </h1>
      <p
        className="text-sm"
        style={{ color: isApproved ? "#166534" : "#991b1b", marginBottom: "1.25rem", maxWidth: 440, margin: "0 auto 1.25rem" }}
      >
        {isApproved
          ? "The review is complete. This decision has been recorded in the activity history below."
          : "Changes have been requested. The writer should address the flagged items and resubmit."}
      </p>
      <button className="btn btn-secondary" onClick={onStartOver}>
        Review another draft
      </button>
    </div>
  );
}
