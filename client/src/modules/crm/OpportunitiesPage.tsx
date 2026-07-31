import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Badge from "../../components/Badge";
import { useApi } from "../../hooks/useApi";
import { crmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

const STAGES = ["Prospecting", "Qualification", "Needs Analysis", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

export default function OpportunitiesPage() {
  const { data, loading, error } = useApi(() => crmApi.listOpportunities(), []);
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState("Open");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((o) => (!stage || o.stage === stage) && (!status || o.status === status));
  }, [data, stage, status]);

  return (
    <>
      <TopBar title="Opportunities" subtitle="CRM · Opportunity Management" />
      <div className="content">
        <div className="filter-bar">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="Open">Open</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}

        {filtered.length > 0 && (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Stage</th>
                  <th>Value</th>
                  <th>Weighted</th>
                  <th>Close Date</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="clickable" onClick={() => navigate(`/crm/opportunities/${o.id}`)}>
                    <td><strong>{o.opportunityName}</strong><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{o.owner}</div></td>
                    <td><Badge>{o.stage}</Badge></td>
                    <td>${o.estimatedValue.toLocaleString()}</td>
                    <td>${(o.weightedRevenue || 0).toLocaleString()}</td>
                    <td>{new Date(o.expectedCloseDate).toLocaleDateString()}</td>
                    <td>
                      {o.risk && (
                        <span className={`risk-${o.risk.level}`} style={{ fontWeight: 700 }}>
                          {o.risk.level}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
