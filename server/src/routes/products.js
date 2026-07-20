import { Router } from "express";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listDocuments,
  listChangeRequests,
  listAudit,
} from "../store/db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

export const productsRouter = Router();
productsRouter.use(requireAuth);

productsRouter.get("/", requirePermission("products:read"), (req, res) => {
  const { q, category, lifecycleStage, complianceStatus, owner } = req.query;
  let results = listProducts();

  if (q) {
    const term = String(q).toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(term))
    );
  }
  if (category) results = results.filter((p) => p.category === category);
  if (lifecycleStage) results = results.filter((p) => p.lifecycleStage === lifecycleStage);
  if (complianceStatus) results = results.filter((p) => p.complianceStatus === complianceStatus);
  if (owner) results = results.filter((p) => (p.owner || "").toLowerCase() === String(owner).toLowerCase());

  res.json(results);
});

productsRouter.get("/:id", requirePermission("products:read"), (req, res) => {
  const product = getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

productsRouter.post("/", requirePermission("products:write"), (req, res) => {
  const { code, name, category, description, lifecycleStage } = req.body || {};
  if (!code || !name || !category || !lifecycleStage) {
    return res.status(400).json({ error: "code, name, category, and lifecycleStage are required" });
  }
  const product = createProduct({ ...req.body }, req.user.name);
  res.status(201).json(product);
});

productsRouter.put("/:id", requirePermission("products:write"), (req, res) => {
  const product = updateProduct(req.params.id, req.body || {}, req.user.name);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

productsRouter.delete("/:id", requirePermission("products:delete"), (req, res) => {
  const ok = deleteProduct(req.params.id, req.user.name);
  if (!ok) return res.status(404).json({ error: "Product not found" });
  res.status(204).send();
});

productsRouter.get("/:id/documents", requirePermission("documents:read"), (req, res) => {
  if (!getProduct(req.params.id)) return res.status(404).json({ error: "Product not found" });
  res.json(listDocuments(req.params.id));
});

productsRouter.get("/:id/change-requests", requirePermission("changeRequests:read"), (req, res) => {
  if (!getProduct(req.params.id)) return res.status(404).json({ error: "Product not found" });
  res.json(listChangeRequests(req.params.id));
});

productsRouter.get("/:id/audit", requirePermission("audit:read"), (req, res) => {
  if (!getProduct(req.params.id)) return res.status(404).json({ error: "Product not found" });
  res.json(listAudit({ entityType: "product", entityId: req.params.id }));
});
