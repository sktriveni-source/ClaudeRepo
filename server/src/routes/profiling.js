import { Router } from "express";
import { DOMAINS } from "../store/db.js";
import { profileDomain } from "../services/profiling.js";

const router = Router();

router.get("/:domain", (req, res) => {
  const { domain } = req.params;
  if (!DOMAINS.includes(domain)) return res.status(404).json({ error: "Unknown domain" });
  res.json(profileDomain(domain));
});

export default router;
