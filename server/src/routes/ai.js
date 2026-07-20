import { Router } from "express";
import { DOMAINS, logAudit } from "../store/db.js";
import { runNaturalLanguageQuery } from "../services/nlQuery.js";
import { recommendFieldMapping, canonicalSchema } from "../services/fieldMapping.js";
import { classifyDomain } from "../services/classification.js";
import { detectAnomalies } from "../services/anomalyDetection.js";
import { suggestPhoneStandardization } from "../services/cleansingSuggestions.js";

const router = Router();

router.post("/nl-query", (req, res) => {
  const { query } = req.body || {};
  if (!query || !query.trim()) return res.status(400).json({ error: "query is required" });
  const result = runNaturalLanguageQuery(query.trim());
  logAudit("ai.nl_query", { query, understood: result.understood, matches: result.matchCount ?? 0 });
  res.json(result);
});

router.get("/field-mapping/schema/:domain", (req, res) => {
  const { domain } = req.params;
  if (!DOMAINS.includes(domain)) return res.status(404).json({ error: "Unknown domain" });
  res.json({ domain, canonicalFields: canonicalSchema(domain) });
});

router.post("/field-mapping/:domain", (req, res) => {
  const { domain } = req.params;
  const { rawFields } = req.body || {};
  if (!DOMAINS.includes(domain)) return res.status(404).json({ error: "Unknown domain" });
  if (!Array.isArray(rawFields) || rawFields.length === 0) return res.status(400).json({ error: "rawFields (array) is required" });
  const mapping = recommendFieldMapping(domain, rawFields);
  res.json({ domain, mapping });
});

router.post("/classify/:domain", (req, res) => {
  const { domain } = req.params;
  if (!DOMAINS.includes(domain)) return res.status(404).json({ error: "Unknown domain" });
  const results = classifyDomain(domain);
  logAudit("ai.classification_run", { domain, count: results.length });
  res.json({ domain, results });
});

router.get("/anomalies/:domain", (req, res) => {
  const { domain } = req.params;
  if (!DOMAINS.includes(domain)) return res.status(404).json({ error: "Unknown domain" });
  res.json(detectAnomalies(domain));
});

router.get("/format-suggestions/:domain", (req, res) => {
  const { domain } = req.params;
  if (!DOMAINS.includes(domain)) return res.status(404).json({ error: "Unknown domain" });
  const suggestion = suggestPhoneStandardization(domain);
  res.json(suggestion || { message: "No format inconsistencies detected" });
});

export default router;
