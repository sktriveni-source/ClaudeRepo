import { Router } from "express";
import { listProducts, listDocuments, listChangeRequests } from "../store/db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { dashboardStats, isApproachingEol, unresolvedCRsFor } from "../services/aiService.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/stats", requirePermission("products:read"), (req, res) => {
  const ctx = { products: listProducts(), documents: listDocuments(), changeRequests: listChangeRequests() };
  res.json(dashboardStats(ctx));
});

dashboardRouter.get("/eol-watchlist", requirePermission("products:read"), (req, res) => {
  const products = listProducts().filter((p) => isApproachingEol(p));
  const changeRequests = listChangeRequests();
  res.json(
    products
      .map((p) => ({ ...p, unresolvedChangeRequests: unresolvedCRsFor(p.id, changeRequests) }))
      .sort((a, b) => new Date(a.eolDate) - new Date(b.eolDate))
  );
});
