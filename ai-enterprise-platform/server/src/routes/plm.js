import { Router } from "express";
import { plmProducts, plmDocuments, plmChangeRequests, listAudit } from "../store/db.js";
import {
  summarizeDocument,
  searchCatalog,
  answerCatalogQuestion,
  duplicateCandidates,
  dataQualityRecommendations,
} from "../ai/plmAi.js";
import { aiEnabled } from "../ai/aiClient.js";

export const plmRouter = Router();

plmRouter.get("/dashboard", (req, res) => {
  const products = plmProducts.list();
  const changeRequests = plmChangeRequests.list();
  const byStage = {};
  for (const p of products) byStage[p.lifecycleStage] = (byStage[p.lifecycleStage] || 0) + 1;
  const eolWithOpenCr = products.filter(
    (p) =>
      ["Phase-Out", "End of Life"].includes(p.lifecycleStage) &&
      changeRequests.some((cr) => cr.productId === p.id && cr.status !== "Implemented")
  );
  res.json({
    totalProducts: products.length,
    totalDocuments: plmDocuments.list().length,
    openChangeRequests: changeRequests.filter((c) => c.status === "Open" || c.status === "In Review").length,
    lifecycleBreakdown: byStage,
    productsNeedingAttention: eolWithOpenCr.map((p) => ({ id: p.id, name: p.name, lifecycleStage: p.lifecycleStage })),
    complianceReviewNeeded: products.filter((p) => p.complianceStatus === "Review Required").length,
    aiEnabled: aiEnabled(),
  });
});

plmRouter.get("/products", (req, res) => {
  const { lifecycleStage, category, q } = req.query;
  let items = plmProducts.list();
  if (lifecycleStage) items = items.filter((p) => p.lifecycleStage === lifecycleStage);
  if (category) items = items.filter((p) => p.category === category);
  if (q) {
    const term = String(q).toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
  }
  res.json(items);
});

plmRouter.post("/products", (req, res) => {
  const created = plmProducts.create(req.body, req.body.changedBy);
  res.status(201).json(created);
});

plmRouter.get("/products/:id", (req, res) => {
  const product = plmProducts.get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

plmRouter.put("/products/:id", (req, res) => {
  const updated = plmProducts.update(req.params.id, req.body, req.body.changedBy);
  if (!updated) return res.status(404).json({ error: "Product not found" });
  res.json(updated);
});

plmRouter.get("/products/:id/documents", (req, res) => {
  res.json(plmDocuments.list((d) => d.productId === req.params.id));
});

plmRouter.post("/products/:id/documents", (req, res) => {
  const created = plmDocuments.create({ ...req.body, productId: req.params.id }, req.body.changedBy);
  res.status(201).json(created);
});

plmRouter.get("/products/:id/quality-recommendations", (req, res) => {
  const product = plmProducts.get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  const recommendations = dataQualityRecommendations(product, plmDocuments.list(), plmChangeRequests.list());
  res.json({ recommendations });
});

plmRouter.get("/documents/:id", (req, res) => {
  const doc = plmDocuments.get(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

plmRouter.get("/change-requests", (req, res) => {
  const { status, productId } = req.query;
  let items = plmChangeRequests.list();
  if (status) items = items.filter((c) => c.status === status);
  if (productId) items = items.filter((c) => c.productId === productId);
  res.json(items);
});

plmRouter.post("/change-requests", (req, res) => {
  const created = plmChangeRequests.create(req.body, req.body.changedBy);
  res.status(201).json(created);
});

plmRouter.put("/change-requests/:id", (req, res) => {
  const updated = plmChangeRequests.update(req.params.id, req.body, req.body.changedBy);
  if (!updated) return res.status(404).json({ error: "Change request not found" });
  res.json(updated);
});

plmRouter.get("/audit", (req, res) => {
  res.json(listAudit({ entityType: req.query.entityType, entityId: req.query.entityId }));
});

// ---- AI ----

plmRouter.post("/ai/search", (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query is required" });
  res.json({ results: searchCatalog(query, plmProducts.list(), plmDocuments.list()) });
});

plmRouter.post("/ai/query", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "question is required" });
  const result = await answerCatalogQuestion(question, {
    products: plmProducts.list(),
    documents: plmDocuments.list(),
    changeRequests: plmChangeRequests.list(),
  });
  res.json(result);
});

plmRouter.post("/ai/summarize-document", async (req, res) => {
  const { documentId } = req.body;
  const doc = plmDocuments.get(documentId);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  const result = await summarizeDocument(doc);
  plmDocuments.update(doc.id, { summary: result.summary }, "AI Assistant");
  res.json(result);
});

plmRouter.get("/ai/duplicates", (req, res) => {
  res.json({ candidates: duplicateCandidates(plmProducts.list()) });
});
