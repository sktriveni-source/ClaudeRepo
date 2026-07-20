import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { DashboardSummary } from "../types";
import ScoreRing from "../components/ScoreRing";
import Sparkline from "../components/Sparkline";
import Badge from "../components/Badge";

const SEVERITY_ORDER: (keyof DashboardSummary["issues"]["bySeverity"])[] = ["critical", "high", "medium", "low"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!data) return <div className="page"><p>Loading dashboard…</p></div>;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Enterprise Data Quality Dashboard</h1>
          <p className="page-subtitle">Live view across {Object.values(data.recordTotals).reduce((a, b) => a + b, 0)} golden records from {data.dataSources.total} connected sources.</p>
        </div>
      </header>

      <section className="card-grid">
        <div className="card score-card">
          <ScoreRing score={data.overallScore} label="Overall" size={110} />
          <div className="score-trend">
            <div className="card-title">8-Week Trend</div>
            <Sparkline points={data.trend} />
          </div>
        </div>

        {data.domains.map((d) => (
          <div className="card" key={d.domain}>
            <div className="card-title-row">
              <span className="card-title capitalize">{d.domain}</span>
              <Badge tone={d.score >= 85 ? "connected" : d.score >= 70 ? "medium" : "critical"}>{d.score}</Badge>
            </div>
            <div className="dimension-bars">
              {Object.entries(d.dimensions).map(([k, v]) => (
                <div className="dimension-bar" key={k}>
                  <span className="dimension-label capitalize">{k}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.round(v * 100)}%` }} />
                  </div>
                  <span className="dimension-value">{Math.round(v * 100)}%</span>
                </div>
              ))}
            </div>
            <div className="card-footnote">{d.recordCount} records</div>
          </div>
        ))}
      </section>

      <section className="card-grid">
        <div className="card">
          <div className="card-title">Open Issues</div>
          <div className="big-number">{data.issues.open}</div>
          <div className="pill-row">
            {SEVERITY_ORDER.map((s) => (
              <span key={s} className="pill-stat">
                <Badge tone={s}>{s}</Badge> {data.issues.bySeverity[s]}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Duplicate Clusters</div>
          <div className="big-number">{data.duplicates.openClusters}</div>
          <div className="card-footnote">{data.duplicates.recordsInvolved} records involved &middot; {data.duplicates.totalClusters} total clusters found</div>
        </div>

        <div className="card">
          <div className="card-title">Pending Approvals</div>
          <div className="big-number">{data.approvals.pending}</div>
          <div className="card-footnote">Merge, cleansing, and rule changes awaiting a steward decision</div>
        </div>

        <div className="card">
          <div className="card-title">Data Sources</div>
          <div className="big-number">{data.dataSources.connected}/{data.dataSources.total}</div>
          <div className="card-footnote">{data.dataSources.degraded} degraded connection{data.dataSources.degraded === 1 ? "" : "s"}</div>
        </div>
      </section>
    </div>
  );
}
