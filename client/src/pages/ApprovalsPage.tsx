import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Approval } from "../types";
import Badge from "../components/Badge";

const TYPE_LABEL: Record<string, string> = {
  merge_duplicate: "Merge duplicate records",
  reject_duplicate: "Dismiss duplicate match",
  apply_fix: "Apply cleansing fix",
};

export default function ApprovalsPage() {
  const [status, setStatus] = useState("pending");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => api.approvals(status || undefined).then(setApprovals);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleDecision(id: string, decision: "approve" | "reject") {
    setBusyId(id);
    await api.decideApproval(id, decision);
    await load();
    setBusyId(null);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Approval Workflows</h1>
          <p className="page-subtitle">Every merge and auto-suggested fix is staged here for a steward to approve before it changes golden data.</p>
        </div>
      </header>

      <div className="tab-row">
        {["pending", "approved", "rejected"].map((s) => (
          <button key={s} className={`tab ${status === s ? "tab-active" : ""}`} onClick={() => setStatus(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Domain</th>
              <th>Description</th>
              <th>Requested By</th>
              <th>Status</th>
              {status === "pending" && <th />}
            </tr>
          </thead>
          <tbody>
            {approvals.map((a) => (
              <tr key={a.id}>
                <td>{TYPE_LABEL[a.type] ?? a.type}</td>
                <td className="capitalize">{a.domain}</td>
                <td>{a.description}</td>
                <td className="cell-secondary">{a.requestedBy}</td>
                <td><Badge tone={a.status}>{a.status}</Badge></td>
                {status === "pending" && (
                  <td className="action-cell">
                    <button className="btn-link" disabled={busyId === a.id} onClick={() => handleDecision(a.id, "approve")}>Approve</button>
                    <button className="btn-link-danger" disabled={busyId === a.id} onClick={() => handleDecision(a.id, "reject")}>Reject</button>
                  </td>
                )}
              </tr>
            ))}
            {approvals.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">No {status} approvals.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
