import { Router } from "express";
import { listAudit } from "../store/db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

export const auditRouter = Router();
auditRouter.use(requireAuth);

auditRouter.get("/", requirePermission("audit:read"), (req, res) => {
  const { entityType, entityId } = req.query;
  const entries = listAudit({ entityType, entityId }).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  res.json(entries);
});
