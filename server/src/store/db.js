import { nextId } from "../utils/id.js";
import { nextRevision } from "../utils/revision.js";
import { seedProducts } from "../data/seed.js";
import { STAGE_IDS } from "../data/stages.js";

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
      revision: p.revision || "A",
      createdAt: now,
      updatedAt: now,
      customers: p.customers.map((c) => ({ id: nextId("CUS"), ...c })),
      suppliers: p.suppliers.map((s) => ({ id: nextId("SUP"), ...s })),
      components: (p.components || []).map((c) => ({ id: nextId("CMP"), ...c })),
      comments: [],
      revisionHistory: [
        {
          id: nextId("REV"),
          revision: p.revision || "A",
          stage: p.lifecycleStage,
          decidedBy: "System",
          decidedAt: now,
          comment: "Initial seed baseline.",
        },
      ],
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
    revision: "A",
    createdAt: now,
    updatedAt: now,
    customers: [],
    suppliers: [],
    components: [],
    comments: [],
    revisionHistory: [
      {
        id: nextId("REV"),
        revision: "A",
        stage: "DEVELOP",
        decidedBy: actor,
        decidedAt: now,
        comment: "Initial creation.",
      },
    ],
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

// ---- Components (Bill of Materials) ----

export function addComponent(productId, data, actor) {
  const product = products.get(productId);
  if (!product) return null;
  const component = {
    id: nextId("CMP"),
    partNumber: data.partNumber || "",
    name: data.name,
    quantity: Number(data.quantity) || 1,
    unitCost: Number(data.unitCost) || 0,
  };
  product.components.push(component);
  product.updatedAt = new Date().toISOString();
  addAudit(productId, actor, "COMPONENT_ADDED", `Component "${component.name}" added to BOM.`);
  return component;
}

export function updateComponent(productId, componentId, data, actor) {
  const product = products.get(productId);
  if (!product) return null;
  const component = product.components.find((c) => c.id === componentId);
  if (!component) return null;
  if (data.partNumber !== undefined) component.partNumber = data.partNumber;
  if (data.name !== undefined) component.name = data.name;
  if (data.quantity !== undefined) component.quantity = Number(data.quantity) || 0;
  if (data.unitCost !== undefined) component.unitCost = Number(data.unitCost) || 0;
  product.updatedAt = new Date().toISOString();
  addAudit(productId, actor, "COMPONENT_UPDATED", `Component "${component.name}" updated in BOM.`);
  return component;
}

export function deleteComponent(productId, componentId, actor) {
  const product = products.get(productId);
  if (!product) return false;
  const idx = product.components.findIndex((c) => c.id === componentId);
  if (idx === -1) return false;
  const [removed] = product.components.splice(idx, 1);
  product.updatedAt = new Date().toISOString();
  addAudit(productId, actor, "COMPONENT_REMOVED", `Component "${removed.name}" removed from BOM.`);
  return true;
}

// ---- Comments (collaboration thread) ----

export function addComment(productId, text, author) {
  const product = products.get(productId);
  if (!product) return null;
  const comment = {
    id: nextId("CMT"),
    author,
    text,
    timestamp: new Date().toISOString(),
  };
  product.comments.push(comment);
  addAudit(productId, author, "COMMENT_ADDED", `Comment posted.`);
  return comment;
}

export function deleteComment(productId, commentId, actor) {
  const product = products.get(productId);
  if (!product) return false;
  const idx = product.comments.findIndex((c) => c.id === commentId);
  if (idx === -1) return false;
  product.comments.splice(idx, 1);
  addAudit(productId, actor, "COMMENT_REMOVED", `Comment removed.`);
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
    product.revision = nextRevision(product.revision);
    product.updatedAt = request.decidedAt;
    product.revisionHistory.push({
      id: nextId("REV"),
      revision: product.revision,
      stage: request.toStage,
      decidedBy: approver,
      decidedAt: request.decidedAt,
      comment: comment || "",
    });
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

// ---- Dashboard / reporting ----

export function getDashboardStats() {
  const allProducts = listProducts();

  const byStage = {};
  STAGE_IDS.forEach((id) => (byStage[id] = 0));
  const byCategory = {};
  for (const p of allProducts) {
    byStage[p.lifecycleStage] = (byStage[p.lifecycleStage] || 0) + 1;
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
  }

  const allRequests = Array.from(stageRequests.values());
  const pendingApprovals = allRequests.filter((r) => r.status === "PENDING").length;
  const approvedRequests = allRequests.filter((r) => r.status === "APPROVED").length;
  const rejectedRequests = allRequests.filter((r) => r.status === "REJECTED").length;

  // Average time spent in each stage, derived from the approved-request
  // timeline per product (mirrors ENOVIA's stage-duration/cycle-time reporting).
  const stageDurationTotals = {};
  STAGE_IDS.forEach((id) => (stageDurationTotals[id] = { totalMs: 0, count: 0 }));

  for (const p of allProducts) {
    const approvedForProduct = allRequests
      .filter((r) => r.productId === p.id && r.status === "APPROVED")
      .sort((a, b) => new Date(a.decidedAt) - new Date(b.decidedAt));
    let cursor = new Date(p.createdAt);
    let stage = "DEVELOP";
    for (const r of approvedForProduct) {
      const transitionedAt = new Date(r.decidedAt);
      stageDurationTotals[stage].totalMs += transitionedAt - cursor;
      stageDurationTotals[stage].count += 1;
      cursor = transitionedAt;
      stage = r.toStage;
    }
  }

  const avgDaysInStage = {};
  STAGE_IDS.forEach((id) => {
    const { totalMs, count } = stageDurationTotals[id];
    avgDaysInStage[id] = count > 0 ? Math.round((totalMs / count / (1000 * 60 * 60 * 24)) * 10) / 10 : null;
  });

  const totalBomCost = allProducts.reduce(
    (sum, p) => sum + p.components.reduce((s, c) => s + c.quantity * c.unitCost, 0),
    0
  );

  return {
    totalProducts: allProducts.length,
    byStage,
    byCategory,
    pendingApprovals,
    approvedRequests,
    rejectedRequests,
    avgDaysInStage,
    totalBomCost: Math.round(totalBomCost * 100) / 100,
  };
}

// ---- Audit log ----

export function listAuditLog(productId) {
  return auditLog
    .filter((a) => !productId || a.productId === productId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
