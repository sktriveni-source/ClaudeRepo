const TONE_MAP: Record<string, string> = {
  // generic
  active: "success",
  approved: "success",
  connected: "success",
  compliant: "success",
  resolved: "success",
  won: "success",
  qualified: "success",
  converted: "success",
  // warnings
  "in review": "warning",
  "review required": "warning",
  pending: "warning",
  "phase-out": "warning",
  draft: "warning",
  medium: "warning",
  contacted: "info",
  // danger
  "end of life": "danger",
  error: "danger",
  critical: "danger",
  high: "danger",
  lost: "danger",
  disqualified: "danger",
  "at risk": "danger",
  open: "info",
  new: "info",
  concept: "info",
  low: "neutral",
};

function toneFor(value: string): string {
  const key = value.toLowerCase();
  return TONE_MAP[key] || "neutral";
}

export default function Badge({ children, tone }: { children: string; tone?: string }) {
  const resolvedTone = tone || toneFor(children);
  return <span className={`badge badge-${resolvedTone}`}>{children}</span>;
}
