import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { DashboardStats, Stage, StageId } from "../types";

const STAGE_LABELS: Record<StageId, string> = {
  DEVELOP: "Develop",
  LAUNCH: "Launch / Introduction",
  GROWTH: "Growth",
  MATURITY: "Maturity",
  DECLINE: "Decline",
};

// Fixed-order categorical hues (validated palette, light mode) for the
// category breakdown — assigned by rank, never cycled per-render.
const CATEGORY_HUES = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dashboard, stageList] = await Promise.all([api.getDashboard(), api.getStages()]);
        setStats(dashboard);
        setStages(stageList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="state-message">Loading dashboard…</div>;
  if (error || !stats) return <div className="state-message error">{error || "No data."}</div>;

  const maxStageCount = Math.max(1, ...Object.values(stats.byStage));
  const categoryEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategoryCount = Math.max(1, ...categoryEntries.map(([, count]) => count));
  const decisionTotal = stats.approvedRequests + stats.rejectedRequests || 1;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            Portfolio-wide reporting across every product's lifecycle stage, approvals, and BOM cost.
          </p>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi-tile">
          <span className="kpi-value">{stats.totalProducts}</span>
          <span className="kpi-label">Total products</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-value">{stats.pendingApprovals}</span>
          <span className="kpi-label">Pending approvals</span>
          {stats.pendingApprovals > 0 && (
            <Link to="/approvals" className="kpi-link">
              Review now →
            </Link>
          )}
        </div>
        <div className="kpi-tile">
          <span className="kpi-value">{stats.approvedRequests}</span>
          <span className="kpi-label">Stage changes approved</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-value">{stats.rejectedRequests}</span>
          <span className="kpi-label">Stage changes rejected</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-value">${stats.totalBomCost.toFixed(2)}</span>
          <span className="kpi-label">Total BOM rollup cost</span>
        </div>
      </div>

      <div className="panel">
        <h3>Products by lifecycle stage</h3>
        <div className="viz-root" data-palette="stage">
          <ul className="bar-list">
            {stages.map((s) => {
              const count = stats.byStage[s.id] ?? 0;
              const avgDays = stats.avgDaysInStage[s.id];
              const widthPct = (count / maxStageCount) * 100;
              return (
                <li key={s.id} className="bar-row">
                  <span className="bar-label">{STAGE_LABELS[s.id]}</span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill stage-${s.id.toLowerCase()}`}
                      style={{ width: `${Math.max(widthPct, count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                  <span className="bar-value">{count}</span>
                  <span className="bar-annotation">
                    {avgDays !== null ? `avg ${avgDays}d in stage` : "no completed cycles yet"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="panel">
        <h3>Approval decisions</h3>
        {stats.approvedRequests + stats.rejectedRequests === 0 ? (
          <p className="hint-text">No stage-change decisions recorded yet.</p>
        ) : (
          <div className="decision-bar" role="img" aria-label="Approved vs rejected stage-change requests">
            <div
              className="decision-segment approved"
              style={{ width: `${(stats.approvedRequests / decisionTotal) * 100}%` }}
            />
            <div
              className="decision-segment rejected"
              style={{ width: `${(stats.rejectedRequests / decisionTotal) * 100}%` }}
            />
          </div>
        )}
        <div className="legend-row">
          <span className="legend-item">
            <span className="legend-swatch approved" /> Approved ({stats.approvedRequests})
          </span>
          <span className="legend-item">
            <span className="legend-swatch rejected" /> Rejected ({stats.rejectedRequests})
          </span>
        </div>
      </div>

      <div className="panel">
        <h3>Products by category</h3>
        {categoryEntries.length === 0 ? (
          <p className="hint-text">No products yet.</p>
        ) : (
          <ul className="bar-list">
            {categoryEntries.map(([category, count], idx) => (
              <li key={category} className="bar-row">
                <span className="bar-label">{category}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(count / maxCategoryCount) * 100}%`,
                      background: CATEGORY_HUES[idx % CATEGORY_HUES.length],
                    }}
                  />
                </div>
                <span className="bar-value">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
