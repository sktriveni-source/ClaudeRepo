export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div className="state-message">{label}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="state-message" style={{ color: "var(--danger)" }}>{message}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <div className="state-message">{message}</div>;
}
