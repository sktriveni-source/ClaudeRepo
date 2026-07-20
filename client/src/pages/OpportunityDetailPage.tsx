import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { NextBestAction, Opportunity, OpportunityRisk, Product } from "../types";
import { money } from "../components/KpiCard";
import { RiskBadge, StageBadge } from "../components/StatusBadge";

const STAGES = ["Prospecting", "Qualification", "Needs Analysis", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [risk, setRisk] = useState<OpportunityRisk | null>(null);
  const [nba, setNba] = useState<NextBestAction | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  function load() {
    if (!id) return;
    api.getOpportunity(id).then(setOpp);
    api.aiOpportunityRisk(id).then(setRisk);
    api.aiNextBestAction(id).then(setNba);
  }

  useEffect(load, [id]);
  useEffect(() => {
    api.getProducts().then(setProducts);
  }, []);

  async function updateStage(stage: string) {
    if (!id) return;
    await api.updateOpportunity(id, { stage });
    load();
  }

  if (!opp) return <div className="empty-state">Loading opportunity…</div>;

  const productNames = opp.products.map((pid) => products.find((p) => p.productId === pid)?.productName || pid);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{opp.opportunityName}</h1>
          <div className="page-subtitle">
            <Link to={`/customers/accounts/${opp.accountId}`}>{opp.accountName}</Link> · Owner: {opp.ownerName}
          </div>
        </div>
        <Link to="/sales/opportunities">← Back to Opportunities</Link>
      </div>

      <div className="kpi-grid">
        <div className="kpi-tile">
          <div className="kpi-label">Estimated Value</div>
          <div className="kpi-value">{money(opp.estimatedValue)}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Probability</div>
          <div className="kpi-value">{opp.probability}%</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Weighted Revenue</div>
          <div className="kpi-value">{money(opp.weightedRevenue || Math.round((opp.estimatedValue * opp.probability) / 100))}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Expected Close</div>
          <div className="kpi-value" style={{ fontSize: 16 }}>
            {opp.expectedCloseDate || "—"}
          </div>
        </div>
      </div>

      {risk && risk.riskLevel !== "None" && (
        <div className="ai-insight" style={{ marginBottom: 18 }}>
          <span className="ai-insight-icon">⚠</span>
          <div>
            <strong>Opportunity Risk: {risk.riskLevel}</strong> — {risk.summary || "No significant risk factors detected."}
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div>
          <div className="card">
            <div className="section-title" style={{ marginTop: 0 }}>
              Opportunity Details
            </div>
            <dl className="field-list">
              <div>
                <dt>Stage</dt>
                <dd>
                  <StageBadge stage={opp.stage} />
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{opp.status}</dd>
              </div>
              <div>
                <dt>Products</dt>
                <dd>{productNames.length ? productNames.join(", ") : "—"}</dd>
              </div>
              <div>
                <dt>Competitors</dt>
                <dd>{opp.competitors.length ? opp.competitors.join(", ") : "None identified"}</dd>
              </div>
              <div>
                <dt>Decision Makers</dt>
                <dd>{opp.decisionMakers.length ? opp.decisionMakers.join(", ") : "None identified"}</dd>
              </div>
              <div>
                <dt>Next Action</dt>
                <dd>{opp.nextAction || "—"}</dd>
              </div>
            </dl>

            {opp.status === "Open" && (
              <div style={{ marginTop: 16 }}>
                <div className="section-title">Update Stage</div>
                <div className="toolbar">
                  {STAGES.map((s) => (
                    <button key={s} className={s === opp.stage ? "primary" : ""} onClick={() => updateStage(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          {risk && (
            <div className="card">
              <div className="section-title" style={{ marginTop: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>AI Risk Assessment</span>
                <RiskBadge level={risk.riskLevel} />
              </div>
              {risk.reasons.length === 0 ? (
                <div className="empty-state">No risk factors detected.</div>
              ) : (
                <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13.5 }}>
                  {risk.reasons.map((r, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {nba && (
            <div className="card" style={{ marginTop: 18 }}>
              <div className="section-title" style={{ marginTop: 0 }}>
                Next Best Action
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13.5 }}>
                {nba.actions.map((a, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {a}
                  </li>
                ))}
              </ul>
              <div className="stat-note" style={{ marginTop: 10 }}>
                The salesperson remains responsible for deciding and initiating any action.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
