import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Opportunity, SalesUser } from "../types";
import { money } from "../components/KpiCard";

export function ReportsPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [users, setUsers] = useState<SalesUser[]>([]);

  useEffect(() => {
    api.getOpportunities().then(setOpportunities);
    api.getSalesUsers().then(setUsers);
  }, []);

  const openOpps = opportunities.filter((o) => o.status === "Open");
  const wonOpps = opportunities.filter((o) => o.status === "Closed Won");
  const lostOpps = opportunities.filter((o) => o.status === "Closed Lost");
  const winRate = wonOpps.length + lostOpps.length > 0 ? Math.round((wonOpps.length / (wonOpps.length + lostOpps.length)) * 100) : 0;

  const byRep = users
    .map((u) => {
      const mine = openOpps.filter((o) => o.ownerId === u.userId);
      const won = wonOpps.filter((o) => o.ownerId === u.userId);
      return {
        user: u,
        openCount: mine.length,
        pipelineValue: mine.reduce((s, o) => s + o.estimatedValue, 0),
        weighted: mine.reduce((s, o) => s + (o.weightedRevenue || 0), 0),
        wonValue: won.reduce((s, o) => s + o.estimatedValue, 0),
      };
    })
    .filter((r) => r.openCount > 0 || r.wonValue > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <div className="page-subtitle">Sales performance analytics</div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-tile">
          <div className="kpi-label">Open Opportunities</div>
          <div className="kpi-value">{openOpps.length}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Closed Won</div>
          <div className="kpi-value">{wonOpps.length}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Closed Lost</div>
          <div className="kpi-value">{lostOpps.length}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Win Rate</div>
          <div className="kpi-value">{winRate}%</div>
        </div>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>
          Performance by Sales Representative
        </div>
        <table>
          <thead>
            <tr>
              <th>Representative</th>
              <th>Role</th>
              <th>Open Opps</th>
              <th>Pipeline</th>
              <th>Weighted</th>
              <th>Closed Won</th>
            </tr>
          </thead>
          <tbody>
            {byRep.map((r) => (
              <tr key={r.user.userId}>
                <td>{r.user.name}</td>
                <td>{r.user.role}</td>
                <td>{r.openCount}</td>
                <td>{money(r.pipelineValue)}</td>
                <td>{money(r.weighted)}</td>
                <td>{money(r.wonValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
