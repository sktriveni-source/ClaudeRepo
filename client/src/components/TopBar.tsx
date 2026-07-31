import { useApi } from "../hooks/useApi";
import { getHealth } from "../api/client";

export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { data } = useApi(getHealth, []);
  const aiEnabled = data?.aiEnabled;

  return (
    <header className="top-bar">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="breadcrumb">{subtitle}</div>}
      </div>
      <div className={`ai-status-pill${aiEnabled ? "" : " heuristic"}`}>
        <span className="dot" />
        {aiEnabled === undefined ? "Checking AI…" : aiEnabled ? "Claude Opus 5 connected" : "Heuristic AI mode"}
      </div>
    </header>
  );
}
