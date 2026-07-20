import { Router } from "express";
import {
  getApprovals,
  getApproval,
  updateApproval,
  getDuplicateCluster,
  updateRecord,
  deleteRecord,
  getRecord,
  getIssue,
  updateIssue,
  logAudit,
} from "../store/db.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getApprovals({ status: req.query.status, type: req.query.type }));
});

function applyMergeDuplicate(approval) {
  const { domain, payload } = approval;
  const { clusterId, goldenRecordId, memberIds } = payload;
  const golden = getRecord(domain, goldenRecordId);
  if (!golden) return;

  // Golden record wins conflicts; fill in any of its own blanks from siblings.
  for (const memberId of memberIds) {
    if (memberId === goldenRecordId) continue;
    const member = getRecord(domain, memberId);
    if (!member) continue;
    for (const [key, value] of Object.entries(member)) {
      if (["id", "sourceId", "sourceRecordId", "createdAt"].includes(key)) continue;
      if ((golden[key] === null || golden[key] === undefined || golden[key] === "") && value) {
        golden[key] = value;
      }
    }
    deleteRecord(domain, memberId);
  }
  updateRecord(domain, goldenRecordId, golden);

  const cluster = getDuplicateCluster(domain, clusterId);
  if (cluster) cluster.status = "merged";
}

function applyRejectDuplicate(approval) {
  const cluster = getDuplicateCluster(approval.domain, approval.payload.clusterId);
  if (cluster) cluster.status = "rejected";
}

function applyFix(approval) {
  const { issueId, recordId, field, suggestedValue } = approval.payload;
  if (field && suggestedValue !== null && suggestedValue !== undefined) {
    updateRecord(approval.domain, recordId, { [field]: suggestedValue });
  }
  const issue = getIssue(issueId);
  if (issue) updateIssue(issueId, { status: "resolved" });
}

router.patch("/:id", (req, res) => {
  const { decision, decidedBy, comment } = req.body || {};
  if (!["approve", "reject"].includes(decision)) {
    return res.status(400).json({ error: 'decision must be "approve" or "reject"' });
  }
  const approval = getApproval(req.params.id);
  if (!approval) return res.status(404).json({ error: "Approval not found" });
  if (approval.status !== "pending") return res.status(409).json({ error: `Approval already ${approval.status}` });

  updateApproval(approval.id, {
    status: decision === "approve" ? "approved" : "rejected",
    decidedBy: decidedBy || "steward.manager@company.com",
    decidedAt: new Date().toISOString(),
    comment: comment || null,
  });

  if (decision === "approve") {
    if (approval.type === "merge_duplicate") applyMergeDuplicate(approval);
    if (approval.type === "apply_fix") applyFix(approval);
    if (approval.type === "reject_duplicate") applyRejectDuplicate(approval);
  } else {
    if (approval.type === "merge_duplicate" || approval.type === "reject_duplicate") {
      const cluster = getDuplicateCluster(approval.domain, approval.payload.clusterId);
      if (cluster) cluster.status = "open";
    }
    if (approval.type === "apply_fix") {
      const issue = getIssue(approval.payload.issueId);
      if (issue) updateIssue(issue.id, { status: "open" });
    }
  }

  logAudit("approval.decided", { approvalId: approval.id, decision, type: approval.type });
  res.json(getApproval(approval.id));
});

export default router;
