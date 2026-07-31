import { Router } from "express";
import { mdmSources, mdmRecords, mdmRules, mdmIssues, listAudit } from "../store/db.js";
import { detectDuplicates, cleansingSuggestions, answerDataQuestion } from "../ai/mdmAi.js";
import { aiEnabled } from "../ai/aiClient.js";

export const mdmRouter = Router();

function qualityScoreFor(record) {
  const attrs = record.attributes || {};
  const fieldCount = Object.keys(attrs).length || 1;
  const missing = Object.values(attrs).filter((v) => v === null || v === undefined || v === "" || v === "not set").length;
  const completeness = 1 - missing / fieldCount;
  const penalty = (record.issues || []).length * 0.12;
  return Math.round(Math.max(0, Math.min(1, completeness - penalty)) * 100);
}

mdmRouter.get("/dashboard", (req, res) => {
  const records = mdmRecords.list();
  const scores = records.map(qualityScoreFor);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const byEntityType = {};
  for (const r of records) byEntityType[r.entityType] = (byEntityType[r.entityType] || 0) + 1;
  const issueCounts = {};
  for (const issue of mdmIssues.list()) issueCounts[issue.type] = (issueCounts[issue.type] || 0) + 1;
  res.json({
    totalSources: mdmSources.list().length,
    totalRecords: records.length,
    averageQualityScore: avgScore,
    recordsByEntityType: byEntityType,
    issueBreakdown: issueCounts,
    openIssues: mdmIssues.list((i) => i.status !== "Resolved").length,
    aiEnabled: aiEnabled(),
  });
});

mdmRouter.get("/sources", (req, res) => res.json(mdmSources.list()));
mdmRouter.post("/sources", (req, res) => res.status(201).json(mdmSources.create(req.body, req.body.changedBy)));

mdmRouter.get("/records", (req, res) => {
  const { entityType, sourceId, minQuality, hasIssue } = req.query;
  let items = mdmRecords.list();
  if (entityType) items = items.filter((r) => r.entityType === entityType);
  if (sourceId) items = items.filter((r) => r.sourceId === sourceId);
  if (hasIssue) items = items.filter((r) => (r.issues || []).includes(hasIssue));
  const withScores = items.map((r) => ({ ...r, qualityScore: qualityScoreFor(r) }));
  const filtered = minQuality ? withScores.filter((r) => r.qualityScore < Number(minQuality)) : withScores;
  res.json(filtered);
});

mdmRouter.get("/records/:id", (req, res) => {
  const record = mdmRecords.get(req.params.id);
  if (!record) return res.status(404).json({ error: "Record not found" });
  res.json({ ...record, qualityScore: qualityScoreFor(record) });
});

mdmRouter.get("/rules", (req, res) => res.json(mdmRules.list()));
mdmRouter.post("/rules", (req, res) => res.status(201).json(mdmRules.create(req.body, req.body.changedBy)));
mdmRouter.put("/rules/:id", (req, res) => {
  const updated = mdmRules.update(req.params.id, req.body, req.body.changedBy);
  if (!updated) return res.status(404).json({ error: "Rule not found" });
  res.json(updated);
});

mdmRouter.get("/issues", (req, res) => {
  const { status, severity } = req.query;
  let items = mdmIssues.list();
  if (status) items = items.filter((i) => i.status === status);
  if (severity) items = items.filter((i) => i.severity === severity);
  const enriched = items.map((i) => ({ ...i, record: mdmRecords.get(i.recordId) }));
  res.json(enriched);
});

mdmRouter.put("/issues/:id", (req, res) => {
  const updated = mdmIssues.update(req.params.id, req.body, req.body.changedBy || req.body.assignedTo);
  if (!updated) return res.status(404).json({ error: "Issue not found" });
  res.json(updated);
});

mdmRouter.get("/audit", (req, res) => {
  res.json(listAudit({ entityType: req.query.entityType, entityId: req.query.entityId }));
});

// ---- AI ----

mdmRouter.get("/ai/duplicates", (req, res) => {
  res.json({ candidates: detectDuplicates(mdmRecords.list()) });
});

mdmRouter.post("/ai/cleansing-suggestions", async (req, res) => {
  const { recordId } = req.body;
  const record = mdmRecords.get(recordId);
  if (!record) return res.status(404).json({ error: "Record not found" });
  const result = await cleansingSuggestions(record);
  res.json(result);
});

mdmRouter.post("/ai/query", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "question is required" });
  const result = await answerDataQuestion(question, mdmRecords.list());
  res.json(result);
});
