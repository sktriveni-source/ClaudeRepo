import { Router } from "express";
import { getIssues, getIssue, updateIssue, addApproval, logAudit } from "../store/db.js";
import { suggestFix } from "../services/cleansingSuggestions.js";

const router = Router();

router.get("/", (req, res) => {
  const { domain, status, severity, category } = req.query;
  res.json(getIssues({ domain, status, severity, category }));
});

router.get("/:id", (req, res) => {
  const issue = getIssue(req.params.id);
  if (!issue) return res.status(404).json({ error: "Issue not found" });
  res.json(issue);
});

router.get("/:id/suggestion", (req, res) => {
  const issue = getIssue(req.params.id);
  if (!issue) return res.status(404).json({ error: "Issue not found" });
  res.json(suggestFix(issue));
});

router.patch("/:id", (req, res) => {
  const { status, assignedTo } = req.body || {};
  const issue = updateIssue(req.params.id, {
    ...(status ? { status } : {}),
    ...(assignedTo !== undefined ? { assignedTo } : {}),
  });
  if (!issue) return res.status(404).json({ error: "Issue not found" });
  logAudit("issue.updated", { issueId: issue.id, status });
  res.json(issue);
});

router.post("/:id/request-fix", (req, res) => {
  const issue = getIssue(req.params.id);
  if (!issue) return res.status(404).json({ error: "Issue not found" });
  const suggestion = suggestFix(issue);
  const approval = addApproval({
    type: "apply_fix",
    domain: issue.domain,
    requestedBy: req.body?.requestedBy || "data.steward@company.com",
    payload: { issueId: issue.id, recordId: issue.recordId, field: suggestion.field || issue.field, suggestedValue: suggestion.suggestedValue ?? null, action: suggestion.action },
    description: suggestion.suggestion,
  });
  updateIssue(issue.id, { status: "in_review" });
  logAudit("issue.fix_requested", { issueId: issue.id, approvalId: approval.id });
  res.status(202).json(approval);
});

export default router;
