import { useState } from "react";
import type { RequirementOrder } from "../types";
import { api } from "../api/client";
import { StatusBadge } from "./StatusBadge";

interface ApprovalBannerProps {
  order: RequirementOrder;
  busy: boolean;
  run: <T>(action: () => Promise<T>) => Promise<T>;
}

export function ApprovalBanner({ order, busy, run }: ApprovalBannerProps) {
  const approval = order.pendingApproval;
  const [decidedBy, setDecidedBy] = useState("");
  const [comments, setComments] = useState("");

  if (!approval) return null;

  async function decide(decision: "APPROVED" | "REJECTED") {
    if (!decidedBy || !approval) return;
    await run(() =>
      api.decideApproval(order.id, approval.id, {
        decision,
        decidedBy,
        comments: comments || undefined,
      })
    );
    setComments("");
  }

  return (
    <div className="card approval-banner">
      <div className="approval-banner__header">
        <StatusBadge label={approval.category} />
        <span className="approval-banner__status">Awaiting approval</span>
      </div>
      <p className="approval-banner__summary">{approval.summary}</p>
      <p className="muted">
        Requested by <strong>{approval.requestedBy}</strong> on{" "}
        {new Date(approval.requestedAt).toLocaleString()}
      </p>
      <div className="form__row">
        <input
          placeholder="Your name (approver)"
          value={decidedBy}
          onChange={(e) => setDecidedBy(e.target.value)}
        />
        <input
          placeholder="Comments (optional)"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>
      <div className="approval-banner__actions">
        <button className="primary" disabled={busy || !decidedBy} onClick={() => decide("APPROVED")}>
          Approve
        </button>
        <button className="danger" disabled={busy || !decidedBy} onClick={() => decide("REJECTED")}>
          Reject
        </button>
      </div>
    </div>
  );
}
