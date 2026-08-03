import type { Activity } from "../types";

const ICONS: Record<string, string> = {
  Call: "📞",
  Email: "✉️",
  Meeting: "🤝",
  Note: "📝",
  StatusChange: "🔄",
  StageChange: "📈",
  Conversion: "✨",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <div className="empty-state">No activity yet. Log a call, email or note to get started.</div>;
  }
  return (
    <div className="timeline">
      {activities.map((a) => (
        <div className="timeline-item" key={a.id}>
          <div className="timeline-dot">{ICONS[a.type] || "•"}</div>
          <div className="timeline-content">
            <div className="subject">{a.subject}</div>
            {a.description && <div className="desc">{a.description}</div>}
            <div className="meta">
              {a.owner} · {formatDate(a.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
