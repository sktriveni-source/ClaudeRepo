import { nextId } from "../utils/id.js";
import { seedProducts } from "../data/seed.js";

// Centralized in-memory data store. This is the single source of truth for
// every client of the API: products, their customers/suppliers, lifecycle
// stage-change (approval) requests, and the audit trail all live here.
const products = new Map();
const stageRequests = new Map();
const auditLog = [];

function addAudit(productId, actor, action, details) {
  const entry = {
    id: nextId("AUD"),
    productId,
    actor,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  auditLog.push(entry);
  return entry;
}

function seed() {
  const now = new Date().toISOString();
  for (const p of seedProducts) {
    const id = nextId("PRD");
    const product = {
      id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      description: p.description,
      price: p.price,
      cost: p.cost,
      owner: p.owner,
      lifecycleStage: p.lifecycleStage,
      createdAt: now,
      updatedAt: now,
      customers: p.customers.map((c) => ({ id: nextId("CUS"), ...c })),
      suppliers: p.suppliers.map((s) => ({ id: nextId("SUP"), ...s })),
    };
    products.set(id, product);
    addAudit(id, "System", "CREATED", `Product "${product.name}" seeded at stage ${product.lifecycleStage}.`);
  }
}

seed();

// ---- Products ----

export function listProducts() {
  return Array.from(products.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getProduct(id) {
  return products.get(id) || null;
}

export function createProduct(data, actor) {
  const now = new Date().toISOString();
  const id = nextId("PRD");
  const product = {
    id,
    name: data.name,
    sku: data.sku,
    category: data.category || "Uncategorized",
    description: data.description || "",
    price: Number(data.price) || 0,
    cost: Number(data.cost) || 0,
    owner: data.owner || "Unassigned",
    lifecycleStage: "DEVELOP",
    createdAt: now,
    updatedAt: now,
    customers: [],
    suppliers: [],
  };
  products.set(id, product);
  addAudit(id, actor, "CREATED", `Product "${product.name}" created in Develop stage.`);
  return product;
}

export function updateProduct(id, data, actor) {
  const product = products.get(id);
  if (!product) return null;
  const fields = ["name", "sku", "category", "description", "price", "cost", "owner"];
  const changes = [];
  for (const field of fields) {
    if (data[field] === undefined) continue;
    const newVal = field === "price" || field === "cost" ? Number(data[field]) : data[field];
    if (product[field] !== newVal) {
      changes.push(`${field}: "${product[field]}" -> "${newVal}"`);
      product[field] = newVal;
    }
  }
  product.updatedAt = new Date().toISOString();
  if (changes.length) {
    addAudit(id, actor, "UPDATED", `Fields changed: ${changes.join(", ")}`);
  }
  return product;
}

export function deleteProduct(id, actor) {
  const product = products.get(id);
  if (!product) return false;
  products.delete(id);
  // Clean up any stage requests tied to this product.
  for (const [reqId, req] of stageRequests.entries()) {
    if (req.productId === id) stageRequests.delete(reqId);
  }
  addAudit(id, actor, "DELETED", `Product "${product.name}" deleted.`);
  return true;
}

// ---- Customers ----

export function addCustomer(productId, data, actor) {
  const product = products.get(productId);
  if (!product) return null;
  const customer = { id: nextId("CUS"), ...data };
  product.customers.push(customer);
  product.updatedAt = new Date().toISOString();
  addAudit(productId, actor, "CUSTOMER_ADDED", `Customer "${customer.name}" added.`);
  return customer;
}

export function updateCustomer(productId, customerId, data, actor) {
  const product = products.get(productId);
  if (!product) return null;
  const customer = product.customers.find((c) => c.id === customerId);
  if (!customer) return null;
  Object.assign(customer, data);
  product.updatedAt = new Date().toISOString();
  addAudit(productId, actor, "CUSTOMER_UPDATED", `Customer "${customer.name}" updated.`);
  return customer;
}

export function deleteCustomer(productId, customerId, actor) {
  const product = products.get(productId);
  if (!product) return false;
  const idx = product.customers.findIndex((c) => c.id === customerId);
  if (idx === -1) return false;
  const [removed] = product.customers.splice(idx, 1);
  product.updatedAt = new Date().toISOString();
  addAudit(productId, actor, "CUSTOMER_REMOVED", `Customer "${removed.name}" removed.`);
  return true;
}

// ---- Suppliers ----

export function addSupplier(productId, data, actor) {
  const product = products.get(productId);
  if (!product) return null;
  const supplier = { id: nextId("SUP"), ...data };
  product.suppliers.push(supplier);
  product.updatedAt = new Date().toISOString();
  addAudit(productId, actor, "SUPPLIER_ADDED", `Supplier "${supplier.name}" added.`);
  return supplier;
}

export function updateSupplier(productId, supplierId, data, actor) {
  const product = products.get(productId);
  if (!product) return null;
  const supplier = product.suppliers.find((s) => s.id === supplierId);
  if (!supplier) return null;
  Object.assign(supplier, data);
  product.updatedAt = new Date().toISOString();
  addAudit(productId, actor, "SUPPLIER_UPDATED", `Supplier "${supplier.name}" updated.`);
  return supplier;
}

export function deleteSupplier(productId, supplierId, actor) {
  const product = products.get(productId);
  if (!product) return false;
  const idx = product.suppliers.findIndex((s) => s.id === supplierId);
  if (idx === -1) return false;
  const [removed] = product.suppliers.splice(idx, 1);
  product.updatedAt = new Date().toISOString();
  addAudit(productId, actor, "SUPPLIER_REMOVED", `Supplier "${removed.name}" removed.`);
  return true;
}

// ---- Lifecycle stage-change requests (approval workflow) ----

export function listStageRequests({ status, productId } = {}) {
  let list = Array.from(stageRequests.values());
  if (status) list = list.filter((r) => r.status === status);
  if (productId) list = list.filter((r) => r.productId === productId);
  return list.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
}

export function getStageRequest(id) {
  return stageRequests.get(id) || null;
}

export function hasPendingRequest(productId) {
  return Array.from(stageRequests.values()).some(
    (r) => r.productId === productId && r.status === "PENDING"
  );
}

export function createStageRequest(product, toStage, requestedBy, comment) {
  const id = nextId("REQ");
  const request = {
    id,
    productId: product.id,
    productName: product.name,
    fromStage: product.lifecycleStage,
    toStage,
    status: "PENDING",
    requestedBy,
    requestedAt: new Date().toISOString(),
    requestComment: comment || "",
    decidedBy: null,
    decidedAt: null,
    decisionComment: null,
  };
  stageRequests.set(id, request);
  addAudit(
    product.id,
    requestedBy,
    "STAGE_CHANGE_REQUESTED",
    `Requested move from ${request.fromStage} to ${toStage}.`
  );
  return request;
}

export function decideStageRequest(id, approve, approver, comment) {
  const request = stageRequests.get(id);
  if (!request || request.status !== "PENDING") return null;
  request.status = approve ? "APPROVED" : "REJECTED";
  request.decidedBy = approver;
  request.decidedAt = new Date().toISOString();
  request.decisionComment = comment || "";

  const product = products.get(request.productId);
  if (approve && product) {
    product.lifecycleStage = request.toStage;
    product.updatedAt = new Date().toISOString();
  }
  addAudit(
    request.productId,
    approver,
    approve ? "STAGE_CHANGE_APPROVED" : "STAGE_CHANGE_REJECTED",
    `${approve ? "Approved" : "Rejected"} move from ${request.fromStage} to ${request.toStage}.${
      comment ? ` Comment: ${comment}` : ""
    }`
  );
  return request;
}

// ---- Audit log ----

export function listAuditLog(productId) {
  return auditLog
    .filter((a) => !productId || a.productId === productId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
