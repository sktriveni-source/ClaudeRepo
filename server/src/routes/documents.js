import { Router } from "express";
import { getDocument, createDocument, deleteDocument, getProduct } from "../store/db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { summarizeDocument, extractMetadata } from "../services/aiService.js";

export const documentsRouter = Router();
documentsRouter.use(requireAuth);

documentsRouter.get("/:id", requirePermission("documents:read"), (req, res) => {
  const doc = getDocument(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

documentsRouter.post("/", requirePermission("documents:write"), (req, res) => {
  const { productId, name, type, content } = req.body || {};
  if (!productId || !name || !type) {
    return res.status(400).json({ error: "productId, name, and type are required" });
  }
  if (!getProduct(productId)) return res.status(404).json({ error: "Product not found" });
  const doc = createDocument({ ...req.body, uploadedBy: req.user.name }, req.user.name);
  res.status(201).json(doc);
});

documentsRouter.delete("/:id", requirePermission("documents:delete"), (req, res) => {
  const ok = deleteDocument(req.params.id, req.user.name);
  if (!ok) return res.status(404).json({ error: "Document not found" });
  res.status(204).send();
});

documentsRouter.post("/:id/summarize", requirePermission("documents:read"), (req, res) => {
  const doc = getDocument(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(summarizeDocument(doc));
});

documentsRouter.post("/:id/extract-metadata", requirePermission("documents:read"), (req, res) => {
  const doc = getDocument(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json({ metadata: extractMetadata(doc.content) });
});
