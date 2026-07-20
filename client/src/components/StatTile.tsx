export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "accent" | "warn" | "danger";
}) {
  return (
    <div className={`stat-tile ${tone !== "default" ? tone : ""}`}>
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
