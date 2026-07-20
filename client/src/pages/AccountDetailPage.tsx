import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Customer360 } from "../types";
import { KpiTile, money } from "../components/KpiCard";
import { AIInsight } from "../components/AIInsight";
import { RiskBadge, StageBadge } from "../components/StatusBadge";

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Customer360 | null>(null);

  useEffect(() => {
    if (id) api.getCustomer360(id).then(setData);
  }, [id]);

  if (!data) return <div className="empty-state">Loading Customer 360…</div>;

  const { account, contacts, opportunities, activities, productsPurchased, aiSummary } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{account.accountName}</h1>
          <div className="page-subtitle">
            {account.industry} · {account.region} · Account Manager: {account.accountManagerName}
          </div>
        </div>
        <Link to="/customers/accounts">← Back to Accounts</Link>
      </div>

      <div className="kpi-grid">
        <KpiTile label="Open Opportunities" value={String(aiSummary.openOpportunities)} />
        <KpiTile label="Pipeline Value" value={money(aiSummary.pipelineValue)} />
        <KpiTile label="Won Business" value={money(aiSummary.wonBusiness)} />
        <KpiTile label="Open Activities" value={String(aiSummary.openActivities)} sub="last 14 days" />
        <KpiTile label="Customer Health" value={aiSummary.customerHealth} />
      </div>

      <AIInsight text={aiSummary.aiInsight} />

      <div className="detail-grid" style={{ marginTop: 22 }}>
        <div>
          <div className="card">
            <div className="section-title" style={{ marginTop: 0 }}>
              Opportunities ({opportunities.length})
            </div>
            {opportunities.length === 0 ? (
              <div className="empty-state">No opportunities yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Stage</th>
                    <th>Value</th>
                    <th>Close Date</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((o) => (
                    <tr key={o.opportunityId}>
                      <td>
                        <Link to={`/sales/opportunities/${o.opportunityId}`}>{o.opportunityName}</Link>
                      </td>
                      <td>
                        <StageBadge stage={o.stage} />
                      </td>
                      <td>{money(o.estimatedValue)}</td>
                      <td>{o.expectedCloseDate}</td>
                      <td>{o.status === "Open" ? <RiskBadge level={o.riskLevel || "Low"} /> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div className="section-title" style={{ marginTop: 0 }}>
              Activity Timeline
            </div>
            {activities.length === 0 ? (
              <div className="empty-state">No activities recorded.</div>
            ) : (
              <div className="timeline">
                {activities.slice(0, 12).map((act) => (
                  <div className="timeline-item" key={act.activityId}>
                    <div className="timeline-date">
                      {act.activityDate} · {act.activityType} · {act.ownerName}
                    </div>
                    <div className="timeline-subject">{act.subject}</div>
                    {act.description && <div className="timeline-desc">{act.description}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="section-title" style={{ marginTop: 0 }}>
              Account Info
            </div>
            <dl className="field-list" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <dt>Country</dt>
                <dd>{account.country}</dd>
              </div>
              <div>
                <dt>Revenue</dt>
                <dd>{money(account.revenue)}</dd>
              </div>
              <div>
                <dt>Employees</dt>
                <dd>{account.employees.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Segment</dt>
                <dd>{account.customerSegment}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{account.customerStatus}</dd>
              </div>
            </dl>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div className="section-title" style={{ marginTop: 0 }}>
              Contacts ({contacts.length})
            </div>
            {contacts.length === 0 ? (
              <div className="empty-state">No contacts yet.</div>
            ) : (
              contacts.map((c) => (
                <div key={c.contactId} style={{ padding: "8px 0", borderBottom: "1px solid var(--gridline)" }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                    {c.firstName} {c.lastName}
                  </div>
                  <div className="stat-note">
                    {c.jobTitle} · {c.decisionMakingRole}
                  </div>
                  <div className="stat-note">{c.email}</div>
                </div>
              ))
            )}
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div className="section-title" style={{ marginTop: 0 }}>
              Products Purchased
            </div>
            {productsPurchased.length === 0 ? (
              <div className="empty-state">No products purchased yet.</div>
            ) : (
              <div className="tag-list">
                {productsPurchased.map((p) => (
                  <span className="tag" key={p.productId}>
                    {p.productName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
