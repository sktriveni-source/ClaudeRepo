import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { ApprovalWithOrder } from "../types";
import { StatusBadge } from "../components/StatusBadge";

const ACTOR_STORAGE_KEY = "supplyflow.actor";

export function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalWithOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decidedBy, setDecidedBy] = useState(() => localStorage.getItem(ACTOR_STORAGE_KEY) || "");
  const [comments, setComments] = useState<Record<string, string>>({});

  function refresh() {
    api
      .listApprovals("PENDING")
      .then(setApprovals)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load approvals"));
  }

  useEffect(refresh, []);
  useEffect(() => {
    localStorage.setItem(ACTOR_STORAGE_KEY, decidedBy);
  }, [decidedBy]);

  async function decide(approval: ApprovalWithOrder, decision: "APPROVED" | "REJECTED") {
    if (!decidedBy) {
      setError('Enter your name in "Approving as" before deciding.');
      return;
    }
    setBusyId(approval.id);
    setError(null);
    try {
      await api.decideApproval(approval.orderId, approval.id, {
        decision,
        decidedBy,
        comments: comments[approval.id] || undefined,
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record decision");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Approvals</h1>
          <p className="page__subtitle">
            Every RFQ, order, goods receipt, invoice, inventory, distribution, delivery and billing
            action across all requirement orders waits here until it's approved or rejected.
          </p>
        </div>
      </div>

      <div className="card actor-bar">
        <label>
          Approving as
          <input
            placeholder="Your name / role, e.g. Priya (Approver)"
            value={decidedBy}
            onChange={(e) => setDecidedBy(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {!approvals && !error && <p>Loading…</p>}

      {approvals && approvals.length === 0 && (
        <div className="card empty-state">
          <p>No approvals are pending right now.</p>
        </div>
      )}

      {approvals && approvals.length > 0 && (
        <div className="approvals-list">
          {approvals.map((a) => (
            <div className="card approval-card" key={a.id}>
              <div className="approval-card__header">
                <StatusBadge label={a.category} />
                <Link to={`/orders/${a.orderId}`}>
                  {a.productName} · #{a.orderId}
                </Link>
              </div>
              <p className="approval-banner__summary">{a.summary}</p>
              <p className="muted">
                Customer: {a.customerName} · Requested by <strong>{a.requestedBy}</strong> on{" "}
                {new Date(a.requestedAt).toLocaleString()}
              </p>
              <div className="form__row">
                <input
                  placeholder="Comments (optional)"
                  value={comments[a.id] || ""}
                  onChange={(e) => setComments((c) => ({ ...c, [a.id]: e.target.value }))}
                />
              </div>
              <div className="approval-banner__actions">
                <button className="primary" disabled={busyId === a.id} onClick={() => decide(a, "APPROVED")}>
                  Approve
                </button>
                <button className="danger" disabled={busyId === a.id} onClick={() => decide(a, "REJECTED")}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
