import { Router } from "express";
import { listProducts, listDocuments, listChangeRequests } from "../store/db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { answerQuery, detectDuplicates, dataQualityReport } from "../services/aiService.js";

export const aiRouter = Router();
aiRouter.use(requireAuth);

function buildContext() {
  return { products: listProducts(), documents: listDocuments(), changeRequests: listChangeRequests() };
}

aiRouter.post("/query", requirePermission("ai:query"), (req, res) => {
  const { question } = req.body || {};
  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: "question is required" });
  }
  res.json(answerQuery(question, buildContext()));
});

aiRouter.get("/duplicates", requirePermission("ai:insights"), (req, res) => {
  res.json(detectDuplicates(listProducts()));
});

aiRouter.get("/data-quality", requirePermission("ai:insights"), (req, res) => {
  res.json(dataQualityReport(buildContext()));
});
