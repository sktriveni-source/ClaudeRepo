import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { StatTile } from "../components/StatTile";
import { LifecycleBadge, CRStatusBadge } from "../components/StatusBadge";
import type { DashboardStats, EolWatchlistProduct } from "../types";
import type { LifecycleStage, CRStatus } from "../types";

function daysUntil(dateStr: string) {
  const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [watchlist, setWatchlist] = useState<EolWatchlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboardStats(), api.eolWatchlist()])
      .then(([s, w]) => {
        setStats(s);
        setWatchlist(w);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <div className="empty-state">Loading dashboard...</div>;

  return (
    <div>
      <div className="stat-grid">
        <StatTile label="Total products" value={stats.totalProducts} />
        <StatTile label="Documents on file" value={stats.totalDocuments} />
        <StatTile label="Approaching end-of-life" value={stats.approachingEolCount} tone="warn" />
        <StatTile
          label="EOL + unresolved change requests"
          value={stats.eolWithUnresolvedCRCount}
          tone="danger"
        />
        <StatTile label="Open change requests" value={stats.openChangeRequestCount} tone="accent" />
        <StatTile label="Data quality issues" value={stats.dataQualityIssueCount} tone="warn" />
      </div>

      <div className="grid-2">
        <div className="card section">
          <div className="card-title">Products approaching end-of-life with unresolved change requests</div>
          {watchlist.filter((p) => p.unresolvedChangeRequests.length > 0).length === 0 ? (
            <div className="empty-state">No products currently match this condition.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>EOL Date</th>
                  <th>Open CRs</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {watchlist
                  .filter((p) => p.unresolvedChangeRequests.length > 0)
                  .map((p) => (
                    <tr key={p.id} className="clickable">
                      <td>
                        <Link to={`/products/${p.id}`}>{p.name}</Link>
                        <div className="muted text-sm">{p.code}</div>
                      </td>
                      <td>
                        {p.eolDate}
                        <div className="muted text-sm">
                          {daysUntil(p.eolDate!) < 0
                            ? `${Math.abs(daysUntil(p.eolDate!))} days past EOL`
                            : `in ${daysUntil(p.eolDate!)} days`}
                        </div>
                      </td>
                      <td>
                        {p.unresolvedChangeRequests.map((cr) => (
                          <div key={cr.id} className="flex-row" style={{ marginBottom: 4 }}>
                            <CRStatusBadge status={cr.status as CRStatus} />
                            <span className="text-sm">{cr.title}</span>
                          </div>
                        ))}
                      </td>
                      <td>
                        <LifecycleBadge stage={p.lifecycleStage as LifecycleStage} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card section">
          <div className="card-title">Change requests by status</div>
          {Object.entries(stats.crByStatus).map(([status, count]) => (
            <div key={status} style={{ marginBottom: 10 }}>
              <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <CRStatusBadge status={status as CRStatus} />
                <span className="text-sm muted">{count}</span>
              </div>
              <div className="progress-bar">
                <div style={{ width: `${(count / stats.totalProducts) * 100}%` }} />
              </div>
            </div>
          ))}

          <div className="card-title" style={{ marginTop: 20 }}>
            Products by lifecycle stage
          </div>
          {Object.entries(stats.byStage).map(([stage, count]) => (
            <div key={stage} className="flex-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <LifecycleBadge stage={stage as LifecycleStage} />
              <span className="text-sm muted">{count} product(s)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
