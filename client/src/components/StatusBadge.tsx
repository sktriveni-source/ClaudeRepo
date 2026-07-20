const RISK_MAP: Record<string, { cls: string; icon: string }> = {
  High: { cls: "badge-critical", icon: "⚠" },
  Medium: { cls: "badge-warning", icon: "●" },
  Low: { cls: "badge-good", icon: "✓" },
  None: { cls: "badge-neutral", icon: "–" },
  Good: { cls: "badge-good", icon: "✓" },
  Fair: { cls: "badge-warning", icon: "●" },
  "At Risk": { cls: "badge-critical", icon: "⚠" },
};

export function RiskBadge({ level }: { level: string }) {
  const conf = RISK_MAP[level] || { cls: "badge-neutral", icon: "" };
  return (
    <span className={`badge ${conf.cls}`}>
      <span className="badge-dot" />
      {level}
    </span>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const cls = stage.startsWith("Closed Won")
    ? "badge-good"
    : stage.startsWith("Closed Lost")
    ? "badge-critical"
    : "badge-neutral";
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {stage}
    </span>
  );
}

export function LeadStatusBadge({ status }: { status: string }) {
  const cls =
    status === "Converted"
      ? "badge-good"
      : status === "Disqualified"
      ? "badge-critical"
      : status === "Qualified"
      ? "badge-warning"
      : "badge-neutral";
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}
