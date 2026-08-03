import type { PipelineStep } from "../types";

export function PipelineFunnel({ steps, counts }: { steps: PipelineStep[]; counts: Record<string, number> }) {
  const max = Math.max(1, ...steps.map((s) => counts[s.key] || 0));
  return (
    <div className="funnel">
      {steps.map((s) => {
        const value = counts[s.key] || 0;
        const pct = Math.round((value / max) * 100);
        return (
          <div className="funnel-row" key={s.key}>
            <span>{s.label}</span>
            <div className="funnel-track">
              <div className="funnel-fill" style={{ width: `${pct}%` }} />
            </div>
            <span style={{ textAlign: "right", fontWeight: 600 }}>{value}</span>
          </div>
        );
      })}
    </div>
  );
}
