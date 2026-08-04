const TONES: Record<string, string> = {
  RAW_MATERIALS: "tone-blue",
  MANUFACTURING: "tone-amber",
  CLOSED: "tone-green",
  SENT: "tone-gray",
  QUOTED: "tone-blue",
  ACCEPTED: "tone-green",
  REJECTED: "tone-red",
  PENDING: "tone-amber",
  PAID: "tone-green",
  ISSUED: "tone-amber",
  PLACED: "tone-blue",
  COMPLETE: "tone-green",
  APPROVED: "tone-green",
  SUBMITTED: "tone-blue",
  ACTION: "tone-gray",
  CREATED: "tone-gray",
  GENERAL: "tone-gray",
};

export function StatusBadge({ label }: { label: string }) {
  const tone = TONES[label] || "tone-gray";
  return <span className={`badge ${tone}`}>{label.replace(/_/g, " ")}</span>;
}
