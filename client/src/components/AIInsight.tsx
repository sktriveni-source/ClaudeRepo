export function AIInsight({ text }: { text: string }) {
  return (
    <div className="ai-insight">
      <span className="ai-insight-icon" aria-hidden>
        ✨
      </span>
      <div>
        <strong>AI Insight: </strong>
        {text}
      </div>
    </div>
  );
}
