import type { PipelineStage } from "../types";
import { money } from "./KpiCard";

const RAMP = ["var(--ordinal-250)", "var(--ordinal-350)", "var(--ordinal-450)", "var(--ordinal-550)", "var(--ordinal-650)"];

export function PipelineFunnel({ stages }: { stages: PipelineStage[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="funnel">
      {stages.map((s, i) => (
        <div className="funnel-row" key={s.stage}>
          <span>{s.stage}</span>
          <div className="funnel-bar-track">
            <div
              className="funnel-bar-fill"
              style={{ width: `${Math.max((s.value / max) * 100, s.value > 0 ? 4 : 0)}%`, background: RAMP[Math.min(i, RAMP.length - 1)] }}
              title={`${s.stage}: ${money(s.value)} across ${s.count} opportunities`}
            />
          </div>
          <span className="stat-note">
            {money(s.value)} · {s.count}
          </span>
        </div>
      ))}
    </div>
  );
}
