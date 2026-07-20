import { Router } from "express";
import { DOMAINS, logAudit } from "../store/db.js";
import { runValidation, runAllValidations } from "../services/validation.js";

const router = Router();

router.post("/run/:domain", (req, res) => {
  const { domain } = req.params;
  if (!DOMAINS.includes(domain)) return res.status(404).json({ error: "Unknown domain" });
  const issues = runValidation(domain);
  logAudit("validation.run", { domain, issuesCreated: issues.length });
  res.json({ domain, issuesCreated: issues.length, issues });
});

router.post("/run-all", (req, res) => {
  const result = runAllValidations();
  logAudit("validation.run_all", { counts: Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.length])) });
  res.json(result);
});

export default router;
