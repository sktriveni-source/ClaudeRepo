import { useState } from "react";
import TopBar from "../../components/TopBar";
import AiAssistantPanel from "../../components/AiAssistantPanel";
import { useApi } from "../../hooks/useApi";
import { crmApi } from "../../api/client";

const OWNERS = ["John Smith", "Aisha Patel", "Carlos Mendes"];

export default function CrmAssistantPage() {
  const [owner, setOwner] = useState(OWNERS[0]);
  const opportunities = useApi(() => crmApi.listOpportunities(), []);

  const atRisk = (opportunities.data || []).filter(
    (o) => o.status === "Open" && o.risk && (o.risk.level === "High" || o.risk.level === "Critical")
  );

  return (
    <>
      <TopBar title="AI Sales Assistant" subtitle="CRM · Ask questions about your pipeline" />
      <div className="content">
        <div className="filter-bar">
          <label style={{ fontSize: 13, color: "var(--text-muted)" }}>Acting as:</label>
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            {OWNERS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="section">
          <AiAssistantPanel
            title="Ask the AI Sales Assistant"
            placeholder="e.g. What should I focus on today?"
            suggestions={[
              "Show my opportunities closing this month.",
              "Which customers have not been contacted during the last 30 days?",
              "Which opportunities are at risk?",
              "What should I focus on today?",
            ]}
            onAsk={(q) => crmApi.aiQuery(q, owner)}
          />
        </div>

        <div className="card section">
          <div className="card-header">
            <h3>✦ Opportunities Flagged At Risk</h3>
          </div>
          {atRisk.length === 0 && <p style={{ color: "var(--text-muted)" }}>No high or critical risk opportunities right now.</p>}
          {atRisk.length > 0 && (
            <table className="data-table">
              <thead><tr><th>Opportunity</th><th>Owner</th><th>Risk</th><th>Factors</th></tr></thead>
              <tbody>
                {atRisk.map((o) => (
                  <tr key={o.id}>
                    <td>{o.opportunityName}</td>
                    <td>{o.owner}</td>
                    <td><span className={`risk-${o.risk!.level}`} style={{ fontWeight: 700 }}>{o.risk!.level}</span></td>
                    <td style={{ fontSize: 12.5 }}>{o.risk!.factors.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
