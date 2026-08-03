const COLORS: Record<string, { bg: string; fg: string }> = {
  New: { bg: "#e0e7ff", fg: "#3730a3" },
  Nurturing: { bg: "#fef3c7", fg: "#92400e" },
  Converted: { bg: "#dcfce7", fg: "#166534" },
  Disqualified: { bg: "#fee2e2", fg: "#991b1b" },
  Opportunity: { bg: "#e0e7ff", fg: "#3730a3" },
  Qualify: { bg: "#dbeafe", fg: "#1e40af" },
  Proposal: { bg: "#fef3c7", fg: "#92400e" },
  Negotiation: { bg: "#ffedd5", fg: "#9a3412" },
  Contract: { bg: "#ede9fe", fg: "#5b21b6" },
  Execute: { bg: "#cffafe", fg: "#155e75" },
  "Closed Won": { bg: "#dcfce7", fg: "#166534" },
  "Closed Lost": { bg: "#fee2e2", fg: "#991b1b" },
};

export function StageBadge({ value }: { value: string }) {
  const c = COLORS[value] || { bg: "#e2e8f0", fg: "#334155" };
  return (
    <span className="badge" style={{ background: c.bg, color: c.fg }}>
      {value}
    </span>
  );
}
