import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { DataQualityIssue } from "../types";

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

export function DataQualityPage() {
  const { can } = useAuth();
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("");

  useEffect(() => {
    if (!can("ai:insights")) {
      setLoading(false);
      return;
    }
    api.aiDataQuality().then(setIssues).finally(() => setLoading(false));
  }, [can]);

  if (!can("ai:insights")) {
    return <div className="card empty-state">Your role does not have access to AI data quality insights.</div>;
  }
  if (loading) return <div className="empty-state">Analyzing product data quality...</div>;

  const filtered = severityFilter ? issues.filter((i) => i.severity === severityFilter) : issues;
  const counts = { high: 0, medium: 0, low: 0 };
  for (const i of issues) counts[i.severity]++;

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-tile danger">
          <div className="value">{counts.high}</div>
          <div className="label">High severity</div>
        </div>
        <div className="stat-tile warn">
          <div className="value">{counts.medium}</div>
          <div className="label">Medium severity</div>
        </div>
        <div className="stat-tile">
          <div className="value">{counts.low}</div>
          <div className="label">Low severity</div>
        </div>
      </div>

      <div className="toolbar">
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <div className="spacer" />
        <span className="muted text-sm">{filtered.length} recommendation(s)</span>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">No data quality issues for this filter.</div>
        ) : (
          [...filtered]
            .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
            .map((issue, i) => (
              <div key={i} className="issue-row">
                <span className={`badge ${issue.severity === "high" ? "red" : issue.severity === "medium" ? "amber" : "neutral"}`}>
                  {issue.severity}
                </span>
                <div>
                  <div>
                    <Link to={`/products/${issue.productId}`}>{issue.productName}</Link>
                    <span className="muted"> &mdash; {issue.issue}</span>
                  </div>
                  <div className="muted text-sm">{issue.recommendation}</div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
