import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import type { Opportunity, StageMeta } from "../types";
import { StageBadge } from "../components/StageBadge";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { ActivityForm } from "../components/ActivityForm";

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const OPEN_STAGE_ORDER = ["Opportunity", "Qualify", "Proposal", "Negotiation", "Contract", "Execute"];

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [stages, setStages] = useState<StageMeta[]>([]);
  const [error, setError] = useState("");

  function reload() {
    if (!id) return;
    api.getOpportunity(id).then(setOpp);
  }
  useEffect(reload, [id]);
  useEffect(() => {
    api.opportunityStages().then((r) => setStages(r.stages));
  }, []);

  async function move(stage: string) {
    if (!opp) return;
    setError("");
    try {
      await api.changeOpportunityStage(opp.id, stage);
      reload();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (!opp) return <div className="loading-state">Loading opportunity…</div>;

  const currentIdx = OPEN_STAGE_ORDER.indexOf(opp.stage);
  const isOpen = OPEN_STAGE_ORDER.includes(opp.stage);
  const nextStage = isOpen && currentIdx < OPEN_STAGE_ORDER.length - 1 ? OPEN_STAGE_ORDER[currentIdx + 1] : null;
  const prevStage = isOpen && currentIdx > 0 ? OPEN_STAGE_ORDER[currentIdx - 1] : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{opp.name}</h1>
          <p className="page-subtitle">
            {opp.account && (
              <Link to={`/accounts/${opp.account.id}`} style={{ color: "var(--primary)" }}>
                {opp.account.name}
              </Link>
            )}
            {opp.contact && (
              <>
                {" · "}
                <Link to={`/contacts/${opp.contact.id}`} style={{ color: "var(--primary)" }}>
                  {opp.contact.firstName} {opp.contact.lastName}
                </Link>
              </>
            )}
          </p>
        </div>
        <StageBadge value={opp.stage} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stage-stepper">
        {stages
          .filter((s) => !s.terminal)
          .map((s) => {
            const idx = OPEN_STAGE_ORDER.indexOf(s.key);
            const cls = !isOpen ? "" : idx < currentIdx ? "done" : idx === currentIdx ? "current" : "";
            return (
              <span key={s.key} className={`stage-pill ${cls}`}>
                {s.label}
              </span>
            );
          })}
        <span className={`stage-pill ${opp.stage === "Closed Won" ? "done" : opp.stage === "Closed Lost" ? "current" : ""}`}>
          {opp.stage === "Closed Lost" ? "Closure – Lost" : "Closure"}
        </span>
      </div>

      {isOpen ? (
        <div className="toolbar">
          {prevStage && (
            <button className="btn btn-secondary" onClick={() => move(prevStage)}>
              ← Back to {prevStage}
            </button>
          )}
          {nextStage ? (
            <button className="btn btn-primary" onClick={() => move(nextStage)}>
              Advance to {nextStage} →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => move("Closed Won")}>
              Mark Closed Won
            </button>
          )}
          <button className="btn btn-danger" onClick={() => move("Closed Lost")}>
            Mark Closed Lost
          </button>
        </div>
      ) : (
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          This opportunity is closed ({opp.stage === "Closed Won" ? "won" : "lost"}).
        </div>
      )}

      <div className="detail-grid">
        <div className="card card-pad">
          <h2 className="section-title">Opportunity Details</h2>
          <div className="info-row">
            <span className="label">Amount</span>
            <span>{currency(opp.amount)}</span>
          </div>
          <div className="info-row">
            <span className="label">Probability</span>
            <span>{opp.probability}%</span>
          </div>
          <div className="info-row">
            <span className="label">Expected close</span>
            <span>{opp.closeDate || "—"}</span>
          </div>
          <div className="info-row">
            <span className="label">Owner</span>
            <span>{opp.owner}</span>
          </div>
          {opp.sourceLeadId && (
            <div className="info-row">
              <span className="label">Converted from</span>
              <Link to={`/leads/${opp.sourceLeadId}`} style={{ color: "var(--primary)" }}>
                {opp.sourceLeadId}
              </Link>
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h2 className="section-title">Activity &amp; Transaction History</h2>
          <ActivityForm relatedType="Opportunity" relatedId={opp.id} owner={opp.owner} onLogged={reload} />
          <ActivityTimeline activities={opp.activities || []} />
        </div>
      </div>
    </div>
  );
}
