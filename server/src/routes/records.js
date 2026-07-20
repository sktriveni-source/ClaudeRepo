import { Router } from "express";
import { getRecords, getDataSource, DOMAINS } from "../store/db.js";
import { scoreRecords } from "../services/qualityScoring.js";

const router = Router();

router.get("/:domain", (req, res) => {
  const { domain } = req.params;
  if (!DOMAINS.includes(domain)) return res.status(404).json({ error: "Unknown domain" });

  const { q, sourceId } = req.query;
  let records = getRecords(domain);
  if (sourceId) records = records.filter((r) => r.sourceId === sourceId);
  if (q) {
    const needle = String(q).toLowerCase();
    records = records.filter((r) => JSON.stringify(r).toLowerCase().includes(needle));
  }

  const scores = new Map(scoreRecords(domain).map((s) => [s.recordId, s]));
  const enriched = records.map((r) => ({
    ...r,
    sourceName: getDataSource(r.sourceId)?.name ?? r.sourceId,
    qualityScore: Math.round((scores.get(r.id)?.overall ?? 1) * 100),
  }));
  res.json(enriched);
});

export default router;
