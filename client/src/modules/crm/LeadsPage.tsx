import { Fragment, useState } from "react";
import TopBar from "../../components/TopBar";
import Badge from "../../components/Badge";
import { useApi } from "../../hooks/useApi";
import { crmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

function scoreTone(score: number) {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "neutral";
}

export default function LeadsPage() {
  const { data, loading, error, reload } = useApi(() => crmApi.listLeads(), []);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = data ? (statusFilter ? data.filter((l) => l.leadStatus === statusFilter) : data) : [];

  async function qualify(id: string) {
    await crmApi.qualifyLead(id);
    reload();
  }

  async function convert(id: string) {
    await crmApi.convertLead(id);
    reload();
  }

  return (
    <>
      <TopBar title="Leads" subtitle="CRM · Lead Management &amp; AI Scoring" />
      <div className="content">
        <div className="filter-bar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Disqualified">Disqualified</option>
          </select>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}

        {filtered.length > 0 && (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>✦ AI Score</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <Fragment key={lead.id}>
                    <tr
                      className="clickable"
                      onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                    >
                      <td><strong>{lead.companyName}</strong></td>
                      <td>{lead.contactName}</td>
                      <td>{lead.leadSource}</td>
                      <td><Badge>{lead.leadStatus}</Badge></td>
                      <td>
                        {lead.aiScore && (
                          <span className={`badge badge-${scoreTone(lead.aiScore.score)}`}>{lead.aiScore.score}/100</span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {lead.leadStatus === "New" || lead.leadStatus === "Contacted" ? (
                          <button className="btn" onClick={() => qualify(lead.id)}>Qualify</button>
                        ) : lead.leadStatus === "Qualified" ? (
                          <button className="btn btn-primary" onClick={() => convert(lead.id)}>Convert</button>
                        ) : null}
                      </td>
                    </tr>
                    {expandedId === lead.id && lead.aiScore && (
                      <tr>
                        <td colSpan={6} style={{ background: "var(--surface-alt)" }}>
                          <div className="ai-insight-box" style={{ margin: "8px 0" }}>
                            <strong>{lead.aiScore.recommendation}</strong>
                            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                              {lead.aiScore.reasons.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
