import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Forecast, SalesUser } from "../types";
import { KpiTile, money } from "../components/KpiCard";
import { AIInsight } from "../components/AIInsight";

export function ForecastPage() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [users, setUsers] = useState<SalesUser[]>([]);
  const [ownerId, setOwnerId] = useState("");

  function load() {
    api.getForecast(ownerId ? { ownerId } : undefined).then(setForecast);
  }

  useEffect(load, [ownerId]);
  useEffect(() => {
    api.getSalesUsers().then(setUsers);
  }, []);

  if (!forecast) return <div className="empty-state">Loading forecast…</div>;

  const attainment = forecast.salesTarget > 0 ? Math.round((forecast.closedWon / forecast.salesTarget) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales Forecast</h1>
          <div className="page-subtitle">2026-Q3 forecast summary</div>
        </div>
      </div>

      <div className="toolbar">
        <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          <option value="">Whole organization</option>
          {users.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="kpi-grid">
        <KpiTile label="Sales Target" value={money(forecast.salesTarget)} />
        <KpiTile label="Total Pipeline" value={money(forecast.totalPipeline)} />
        <KpiTile label="Weighted Pipeline" value={money(forecast.weightedPipeline)} />
        <KpiTile label="Committed" value={money(forecast.committed)} sub="Probability ≥ 65%" />
        <KpiTile label="Best Case" value={money(forecast.bestCase)} sub="Probability ≥ 40%" />
        <KpiTile label="Closed Won" value={money(forecast.closedWon)} sub={`${attainment}% of target`} />
      </div>

      <AIInsight text={forecast.aiHighlight} />

      {forecast.staleHighValueOpportunities.length > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="section-title" style={{ marginTop: 0 }}>
            High-Value Opportunities Needing Attention
          </div>
          <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13.5 }}>
            {forecast.staleHighValueOpportunities.map((o) => (
              <li key={o.id} style={{ marginBottom: 6 }}>
                {o.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
