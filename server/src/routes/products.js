import { Router } from "express";
import * as db from "../store/db.js";

export const productsRouter = Router();

function actorOf(req) {
  return (req.body && req.body.actor) || req.query.actor || "Unknown user";
}

function withoutActor(body) {
  const { actor, ...rest } = body;
  return rest;
}

productsRouter.get("/", (req, res) => {
  res.json(db.listProducts());
});

productsRouter.get("/:id", (req, res) => {
  const product = db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

productsRouter.post("/", (req, res) => {
  const { name, sku } = req.body;
  if (!name || !sku) {
    return res.status(400).json({ error: "name and sku are required" });
  }
  const product = db.createProduct(req.body, actorOf(req));
  res.status(201).json(product);
});

productsRouter.put("/:id", (req, res) => {
  const product = db.updateProduct(req.params.id, req.body, actorOf(req));
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

productsRouter.delete("/:id", (req, res) => {
  const ok = db.deleteProduct(req.params.id, actorOf(req));
  if (!ok) return res.status(404).json({ error: "Product not found" });
  res.status(204).end();
});

// ---- Customers ----

productsRouter.post("/:id/customers", (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: "name is required" });
  const customer = db.addCustomer(req.params.id, withoutActor(req.body), actorOf(req));
  if (!customer) return res.status(404).json({ error: "Product not found" });
  res.status(201).json(customer);
});

productsRouter.put("/:id/customers/:customerId", (req, res) => {
  const customer = db.updateCustomer(req.params.id, req.params.customerId, withoutActor(req.body), actorOf(req));
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

productsRouter.delete("/:id/customers/:customerId", (req, res) => {
  const ok = db.deleteCustomer(req.params.id, req.params.customerId, actorOf(req));
  if (!ok) return res.status(404).json({ error: "Customer not found" });
  res.status(204).end();
});

// ---- Suppliers ----

productsRouter.post("/:id/suppliers", (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: "name is required" });
  const supplier = db.addSupplier(req.params.id, withoutActor(req.body), actorOf(req));
  if (!supplier) return res.status(404).json({ error: "Product not found" });
  res.status(201).json(supplier);
});

productsRouter.put("/:id/suppliers/:supplierId", (req, res) => {
  const supplier = db.updateSupplier(req.params.id, req.params.supplierId, withoutActor(req.body), actorOf(req));
  if (!supplier) return res.status(404).json({ error: "Supplier not found" });
  res.json(supplier);
});

productsRouter.delete("/:id/suppliers/:supplierId", (req, res) => {
  const ok = db.deleteSupplier(req.params.id, req.params.supplierId, actorOf(req));
  if (!ok) return res.status(404).json({ error: "Supplier not found" });
  res.status(204).end();
});

// ---- Components (Bill of Materials) ----

productsRouter.post("/:id/components", (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: "name is required" });
  const component = db.addComponent(req.params.id, withoutActor(req.body), actorOf(req));
  if (!component) return res.status(404).json({ error: "Product not found" });
  res.status(201).json(component);
});

productsRouter.put("/:id/components/:componentId", (req, res) => {
  const component = db.updateComponent(req.params.id, req.params.componentId, withoutActor(req.body), actorOf(req));
  if (!component) return res.status(404).json({ error: "Component not found" });
  res.json(component);
});

productsRouter.delete("/:id/components/:componentId", (req, res) => {
  const ok = db.deleteComponent(req.params.id, req.params.componentId, actorOf(req));
  if (!ok) return res.status(404).json({ error: "Component not found" });
  res.status(204).end();
});

// ---- Comments (collaboration thread) ----

productsRouter.post("/:id/comments", (req, res) => {
  if (!req.body.text || !req.body.text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }
  const comment = db.addComment(req.params.id, req.body.text.trim(), actorOf(req));
  if (!comment) return res.status(404).json({ error: "Product not found" });
  res.status(201).json(comment);
});

productsRouter.delete("/:id/comments/:commentId", (req, res) => {
  const ok = db.deleteComment(req.params.id, req.params.commentId, actorOf(req));
  if (!ok) return res.status(404).json({ error: "Comment not found" });
  res.status(204).end();
});

// ---- Stage requests & audit scoped to a product ----

productsRouter.get("/:id/requests", (req, res) => {
  const product = db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(db.listStageRequests({ productId: req.params.id }));
});

productsRouter.get("/:id/audit", (req, res) => {
  const product = db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(db.listAuditLog(req.params.id));
});
