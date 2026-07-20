import { Router } from "express";
import { getRules, addRule, deleteRule, logAudit, DOMAINS } from "../store/db.js";
import { buildRuleFromText } from "../services/nlRuleBuilder.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getRules(req.query.domain));
});

router.post("/", (req, res) => {
  const { domain, field, ruleType, severity, description } = req.body || {};
  if (!domain || !DOMAINS.includes(domain) || !field || !ruleType) {
    return res.status(400).json({ error: "domain, field, and ruleType are required" });
  }
  const rule = addRule({ ...req.body, severity: severity || "medium" });
  res.status(201).json(rule);
});

router.post("/from-text", (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "text is required" });
  const result = buildRuleFromText(text);
  res.json(result);
});

router.delete("/:id", (req, res) => {
  const ok = deleteRule(req.params.id);
  if (!ok) return res.status(404).json({ error: "Rule not found" });
  logAudit("rule.deleted", { ruleId: req.params.id });
  res.status(204).end();
});

export default router;
