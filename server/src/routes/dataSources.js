import { Router } from "express";
import { getDataSources, addDataSource, touchDataSourceSync, getRecords } from "../store/db.js";

const router = Router();

router.get("/", (req, res) => {
  const sources = getDataSources().map((s) => ({
    ...s,
    recordCount: s.domain === "mixed" ? 0 : (getRecords(s.domain) || []).filter((r) => r.sourceId === s.id).length,
  }));
  res.json(sources);
});

router.post("/", (req, res) => {
  const { name, type, connector, endpoint, domain } = req.body || {};
  if (!name || !type || !domain) {
    return res.status(400).json({ error: "name, type, and domain are required" });
  }
  const source = addDataSource({ name, type, connector: connector || "REST / API Key", endpoint: endpoint || "", domain, syncFrequency: "Manual" });
  res.status(201).json(source);
});

router.post("/:id/sync", (req, res) => {
  const source = touchDataSourceSync(req.params.id);
  if (!source) return res.status(404).json({ error: "Data source not found" });
  res.json(source);
});

export default router;
