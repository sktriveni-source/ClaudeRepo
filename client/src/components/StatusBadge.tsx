import type { BookingStatus } from "../types";

const CONFIG: Record<BookingStatus, { label: string; cls: string }> = {
  CONFIRMED: { label: "Confirmed", cls: "badge-success" },
  BLOCKED: { label: "Awaiting Payment", cls: "badge-warning" },
  EXPIRED: { label: "Expired", cls: "badge-danger" },
  CANCELLED: { label: "Cancelled", cls: "badge-muted" },
};

export default function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, cls } = CONFIG[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
