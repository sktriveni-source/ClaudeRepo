import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import type { Lead } from "../types";
import { StageBadge } from "../components/StageBadge";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { ActivityForm } from "../components/ActivityForm";
import { Modal } from "../components/Modal";

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [error, setError] = useState("");
  const [showConvert, setShowConvert] = useState(false);
  const navigate = useNavigate();

  function reload() {
    if (!id) return;
    api.getLead(id).then(setLead);
  }

  useEffect(reload, [id]);

  async function transition(status: string) {
    if (!lead) return;
    setError("");
    try {
      await api.changeLeadStatus(lead.id, status);
      reload();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (!lead) return <div className="loading-state">Loading lead…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            {lead.firstName} {lead.lastName}
          </h1>
          <p className="page-subtitle">
            {lead.title ? `${lead.title} · ` : ""}
            {lead.company}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StageBadge value={lead.status} />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {lead.status === "Converted" ? (
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          This lead has been converted.{" "}
          {lead.convertedOpportunityId && (
            <>
              View the resulting{" "}
              <Link to={`/opportunities/${lead.convertedOpportunityId}`} style={{ color: "var(--primary)", fontWeight: 600 }}>
                opportunity
              </Link>
              .
            </>
          )}
        </div>
      ) : lead.status === "Disqualified" ? (
        <div className="toolbar">
          <button className="btn btn-secondary" onClick={() => transition("New")}>
            Re-engage lead
          </button>
        </div>
      ) : (
        <div className="toolbar">
          {lead.status === "New" && (
            <button className="btn btn-secondary" onClick={() => transition("Nurturing")}>
              Move to Nurture Lead
            </button>
          )}
          {lead.status === "Nurturing" && (
            <button className="btn btn-secondary" onClick={() => transition("New")}>
              Move back to Lead / Engagement
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowConvert(true)}>
            Convert to Opportunity
          </button>
          <button className="btn btn-danger" onClick={() => transition("Disqualified")}>
            Disqualify
          </button>
        </div>
      )}

      <div className="detail-grid">
        <div className="card card-pad">
          <h2 className="section-title">Lead Details</h2>
          <div className="info-row">
            <span className="label">Email</span>
            <span>{lead.email || "—"}</span>
          </div>
          <div className="info-row">
            <span className="label">Phone</span>
            <span>{lead.phone || "—"}</span>
          </div>
          <div className="info-row">
            <span className="label">Source</span>
            <span>{lead.source}</span>
          </div>
          <div className="info-row">
            <span className="label">Rating</span>
            <span>{lead.rating}</span>
          </div>
          <div className="info-row">
            <span className="label">Owner</span>
            <span>{lead.owner}</span>
          </div>
          {lead.notes && (
            <div className="info-row">
              <span className="label">Notes</span>
              <span>{lead.notes}</span>
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h2 className="section-title">Activity</h2>
          <ActivityForm relatedType="Lead" relatedId={lead.id} owner={lead.owner} onLogged={reload} />
          <ActivityTimeline activities={lead.activities || []} />
        </div>
      </div>

      {showConvert && (
        <ConvertModal
          lead={lead}
          onClose={() => setShowConvert(false)}
          onConverted={(oppId) => navigate(`/opportunities/${oppId}`)}
        />
      )}
    </div>
  );
}

function ConvertModal({
  lead,
  onClose,
  onConverted,
}: {
  lead: Lead;
  onClose: () => void;
  onConverted: (opportunityId: string) => void;
}) {
  const [amount, setAmount] = useState("0");
  const [closeDate, setCloseDate] = useState("");
  const [opportunityName, setOpportunityName] = useState(`${lead.company} – New Business`);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await api.convertLead(lead.id, {
        amount: Number(amount) || 0,
        closeDate: closeDate || undefined,
        opportunityName,
        owner: lead.owner,
      });
      onConverted(result.opportunity.id);
    } catch (err: any) {
      setError(err.message || "Failed to convert lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Convert Lead"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Converting…" : "Convert"}
          </button>
        </>
      }
    >
      <form onSubmit={submit}>
        {error && <div className="error-banner">{error}</div>}
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 0 }}>
          Converting will create (or reuse) an Account for <strong>{lead.company}</strong>, a Contact for{" "}
          <strong>
            {lead.firstName} {lead.lastName}
          </strong>
          , and a new Opportunity at the <strong>Opportunity</strong> stage.
        </p>
        <div className="form-grid">
          <div className="field full">
            <label>Opportunity name</label>
            <input className="input" value={opportunityName} onChange={(e) => setOpportunityName(e.target.value)} />
          </div>
          <div className="field">
            <label>Amount (USD)</label>
            <input className="input" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="field">
            <label>Expected close date</label>
            <input className="input" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
