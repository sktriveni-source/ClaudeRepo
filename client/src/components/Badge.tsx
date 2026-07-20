import type { ReactNode } from "react";

type BadgeTone = "critical" | "high" | "medium" | "low" | "open" | "in_review" | "resolved" | "rejected" | "connected" | "degraded" | "pending" | "approved" | "merged" | "neutral";

const TONE_CLASS: Record<string, string> = {
  critical: "badge-critical",
  high: "badge-high",
  medium: "badge-medium",
  low: "badge-low",
  open: "badge-medium",
  in_review: "badge-low",
  pending: "badge-low",
  resolved: "badge-connected",
  approved: "badge-connected",
  merged: "badge-connected",
  connected: "badge-connected",
  rejected: "badge-critical",
  degraded: "badge-high",
  neutral: "badge-neutral",
};

export default function Badge({ tone, children }: { tone: BadgeTone | string; children: ReactNode }) {
  const cls = TONE_CLASS[tone] ?? "badge-neutral";
  return <span className={`badge ${cls}`}>{children}</span>;
}
