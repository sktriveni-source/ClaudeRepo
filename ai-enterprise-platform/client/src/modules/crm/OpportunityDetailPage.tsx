import { useParams, Link } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Badge from "../../components/Badge";
import StatCard from "../../components/StatCard";
import { useApi } from "../../hooks/useApi";
import { crmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useApi(() => crmApi.getOpportunity(id!), [id]);

  if (loading) return <div className="content"><LoadingState /></div>;
  if (error || !data) return <div className="content"><ErrorState message={error || "Not found"} /></div>;

  const o = data;

  return (
    <>
      <TopBar title={o.opportunityName} subtitle={`CRM · Opportunities · ${o.stage}`} />
      <div className="content">
        <div className="grid grid-4 section">
          <StatCard label="Estimated Value" value={`$${o.estimatedValue.toLocaleString()}`} />
          <StatCard label="Probability" value={`${o.probability}%`} />
          <StatCard label="Weighted Revenue" value={`$${(o.weightedRevenue || 0).toLocaleString()}`} hint="Value × Probability" />
          <StatCard label="Expected Close" value={new Date(o.expectedCloseDate).toLocaleDateString()} />
        </div>

        {o.risk && (
          <div className="card section">
            <div className="card-header">
              <h3>✦ AI Opportunity Risk</h3>
              <span className={`risk-${o.risk.level}`} style={{ fontWeight: 800, fontSize: 15 }}>{o.risk.level}</span>
            </div>
            {o.risk.factors.length === 0 ? (
              <p style={{ color: "var(--success)" }}>No risk factors detected — opportunity looks healthy.</p>
            ) : (
              <div className="ai-insight-box">
                <strong>Risk factors identified:</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {o.risk.factors.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {o.nextBestActions && (
          <div className="card section">
            <div className="card-header">
              <h3>✦ Next Best Actions</h3>
            </div>
            <div className="ai-suggestions">
              {o.nextBestActions.map((a, i) => (
                <span key={i} className="ai-suggestion-chip" style={{ cursor: "default" }}>{a}</span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-2 section">
          <div className="card">
            <div className="card-header"><h3>Opportunity Details</h3></div>
            <table className="data-table">
              <tbody>
                <tr><td>Owner</td><td>{o.owner}</td></tr>
                <tr><td>Stage</td><td><Badge>{o.stage}</Badge></td></tr>
                <tr><td>Status</td><td><Badge>{o.status}</Badge></td></tr>
                <tr><td>Products</td><td>{o.products.join(", ") || "—"}</td></tr>
                <tr><td>Competitors</td><td>{o.competitors.join(", ") || "None identified"}</td></tr>
                <tr><td>Decision Makers</td><td>{o.decisionMakers.length || "None identified"}</td></tr>
                <tr><td>Next Action</td><td>{o.nextAction || "—"}</td></tr>
                <tr><td>Account</td><td><Link to={`/crm/accounts/${o.accountId}`}>View Customer 360</Link></td></tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header"><h3>Sales Activity Timeline</h3></div>
            {(!o.activities || o.activities.length === 0) && <p style={{ color: "var(--text-muted)" }}>No activity recorded.</p>}
            <ul className="timeline">
              {(o.activities || []).map((a) => (
                <li key={a.id}>
                  <div className="timeline-date">{new Date(a.activityDate).toLocaleDateString()} · {a.activityType}</div>
                  <div className="timeline-title">{a.subject}</div>
                  <div className="timeline-desc">{a.description}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
