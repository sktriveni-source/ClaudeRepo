import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { DashboardData } from "../types";
import { KpiTile, money } from "../components/KpiCard";
import { AIInsight } from "../components/AIInsight";

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.getDashboard().then(setData);
  }, []);

  if (!data) return <div className="empty-state">Loading dashboard…</div>;

  const { kpis } = data;
  const maxLeadCount = Math.max(...data.leadsByStatus.map((s) => s.count), 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="page-subtitle">Organization-wide sales performance snapshot</div>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiTile label="Total Accounts" value={String(kpis.totalAccounts)} />
        <KpiTile label="Open Opportunities" value={String(kpis.openOpportunities)} />
        <KpiTile label="Total Pipeline" value={money(kpis.totalPipeline)} />
        <KpiTile label="Weighted Pipeline" value={money(kpis.weightedPipeline)} />
        <KpiTile label="Sales Target" value={money(kpis.salesTarget)} sub="2026-Q3" />
        <KpiTile label="Closed Won" value={money(kpis.closedWon)} />
        <KpiTile label="Open Leads" value={String(kpis.openLeads)} />
        <KpiTile label="Stale Accounts" value={String(kpis.staleAccounts)} sub="No activity in 30+ days" />
      </div>

      <AIInsight text={data.aiHighlight} />

      <div className="detail-grid" style={{ marginTop: 22 }}>
        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>
            Opportunities at High Risk
          </div>
          {data.riskyOpportunities.length === 0 ? (
            <div className="empty-state">No high-risk opportunities right now.</div>
          ) : (
            <div className="table-wrap" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Risk summary</th>
                  </tr>
                </thead>
                <tbody>
                  {data.riskyOpportunities.map((r) => (
                    <tr key={r.opportunityId}>
                      <td>
                        <Link to={`/sales/opportunities/${r.opportunityId}`}>{r.opportunityName}</Link>
                      </td>
                      <td className="stat-note">{r.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>
            Leads by Status
          </div>
          <div className="funnel">
            {data.leadsByStatus.map((s) => (
              <div className="funnel-row" key={s.status} style={{ gridTemplateColumns: "100px 1fr 30px" }}>
                <span>{s.status}</span>
                <div className="funnel-bar-track">
                  <div
                    className="funnel-bar-fill"
                    style={{ width: `${Math.max((s.count / maxLeadCount) * 100, s.count > 0 ? 6 : 0)}%` }}
                  />
                </div>
                <span className="stat-note">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
