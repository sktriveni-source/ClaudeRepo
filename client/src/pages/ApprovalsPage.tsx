import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useUser } from "../context/UserContext";
import type { StageRequest } from "../types";

export default function ApprovalsPage() {
  const { actorLabel, persona } = useUser();
  const [requests, setRequests] = useState<StageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const all = await api.listStageRequests();
      setRequests(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approval requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pending = requests.filter((r) => r.status === "PENDING");
  const decided = requests.filter((r) => r.status !== "PENDING");

  const canDecide = persona.role === "Approver";

  async function decide(id: string, approve: boolean) {
    if (!canDecide) return;
    setBusyId(id);
    setError(null);
    try {
      const fn = approve ? api.approveStageRequest : api.rejectStageRequest;
      await fn(id, actorLabel, persona.role, comments[id] || "");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record decision.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="state-message">Loading approvals…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Approvals</h1>
          <p className="page-subtitle">
            Lifecycle stage-change requests waiting on sign-off. Acting as{" "}
            <strong>{persona.name}</strong> ({persona.role}).
          </p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {!canDecide && pending.length > 0 && (
        <div className="form-warning">
          You're acting as a {persona.role}. Switch to an Approver persona in the header to approve or
          reject requests — mirrors ENOVIA's role-based change assignments.
        </div>
      )}

      {pending.length === 0 ? (
        <div className="state-message">No pending requests. Everything is caught up.</div>
      ) : (
        <div className="approval-list">
          {pending.map((r) => (
            <div key={r.id} className="approval-card">
              <div className="approval-card-top">
                <div>
                  <Link to={`/products/${r.productId}`} className="approval-product-link">
                    {r.productName}
                  </Link>
                  <p className="hint-text">
                    {r.fromStage} → {r.toStage} · requested by {r.requestedBy} on{" "}
                    {new Date(r.requestedAt).toLocaleString()}
                  </p>
                  {r.requestComment && <p className="approval-comment">"{r.requestComment}"</p>}
                </div>
                <span className="status-pill status-pending">PENDING</span>
              </div>
              <textarea
                placeholder="Optional decision comment…"
                rows={2}
                value={comments[r.id] || ""}
                onChange={(e) => setComments((c) => ({ ...c, [r.id]: e.target.value }))}
              />
              <div className="form-actions">
                <button
                  className="btn btn-danger-ghost"
                  disabled={busyId === r.id || !canDecide}
                  title={!canDecide ? "Switch to an Approver persona to decide" : undefined}
                  onClick={() => decide(r.id, false)}
                >
                  Reject
                </button>
                <button
                  className="btn btn-primary"
                  disabled={busyId === r.id || !canDecide}
                  title={!canDecide ? "Switch to an Approver persona to decide" : undefined}
                  onClick={() => decide(r.id, true)}
                >
                  {busyId === r.id ? "Saving…" : "Approve"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="panel-header section-spacer">
        <h3>Decision history</h3>
        <button className="btn btn-link" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? "Hide" : "Show"} ({decided.length})
        </button>
      </div>
      {showHistory && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Requested by</th>
              <th>Decided by</th>
            </tr>
          </thead>
          <tbody>
            {decided.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/products/${r.productId}`}>{r.productName}</Link>
                </td>
                <td>{r.fromStage}</td>
                <td>{r.toStage}</td>
                <td>
                  <span className={`status-pill status-${r.status.toLowerCase()}`}>{r.status}</span>
                </td>
                <td>{r.requestedBy}</td>
                <td>{r.decidedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
