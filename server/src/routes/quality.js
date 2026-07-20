import { Router } from "express";
import { DOMAINS } from "../store/db.js";
import { scoreDomain, scoreAllDomains } from "../services/qualityScoring.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(scoreAllDomains());
});

router.get("/:domain", (req, res) => {
  const { domain } = req.params;
  if (!DOMAINS.includes(domain)) return res.status(404).json({ error: "Unknown domain" });
  res.json(scoreDomain(domain));
});

export default router;
