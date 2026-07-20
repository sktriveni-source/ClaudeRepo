import { users as seedUsers } from "../data/users.js";
import { products as seedProducts } from "../data/products.js";
import { documents as seedDocuments } from "../data/documents.js";
import { changeRequests as seedChangeRequests } from "../data/changeRequests.js";
import { auditLog as seedAuditLog } from "../data/auditLog.js";

// Simple in-memory store, mirroring the pattern used elsewhere in this
// repo: seed data cloned into mutable arrays, no external DB dependency.
const state = {
  users: seedUsers.map((u) => ({ ...u })),
  products: seedProducts.map((p) => ({ ...p, attributes: { ...p.attributes } })),
  documents: seedDocuments.map((d) => ({ ...d })),
  changeRequests: seedChangeRequests.map((c) => ({ ...c })),
  auditLog: seedAuditLog.map((a) => ({ ...a })),
};

let nextIds = { product: 1022, document: 2015, changeRequest: 2012, audit: 3016 };

export function nextId(kind) {
  const id = nextIds[kind]++;
  return id;
}

export function recordAudit({ entityType, entityId, action, user, details }) {
  const entry = {
    id: `AUD-${nextId("audit")}`,
    entityType,
    entityId,
    action,
    user,
    timestamp: new Date().toISOString(),
    details,
  };
  state.auditLog.unshift(entry);
  return entry;
}

// --- Users ---
export function listUsers() {
  return state.users;
}
export function findUserByEmail(email) {
  return state.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
}

// --- Products ---
export function listProducts() {
  return state.products;
}
export function getProduct(id) {
  return state.products.find((p) => p.id === id);
}
export function createProduct(data, actor) {
  const product = {
    id: `PRD-${nextId("product")}`,
    revision: "A",
    tags: [],
    attributes: {},
    eolDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };
  state.products.push(product);
  recordAudit({
    entityType: "product",
    entityId: product.id,
    action: "created",
    user: actor,
    details: `Product ${product.code || product.id} created.`,
  });
  return product;
}
export function updateProduct(id, patch, actor) {
  const product = getProduct(id);
  if (!product) return null;
  const before = { ...product };
  Object.assign(product, patch, { updatedAt: new Date().toISOString() });
  const changedFields = Object.keys(patch).filter((k) => before[k] !== product[k]);
  if (changedFields.length) {
    recordAudit({
      entityType: "product",
      entityId: product.id,
      action: changedFields.includes("lifecycleStage") ? "status_changed" : "updated",
      user: actor,
      details: `Updated fields: ${changedFields.join(", ")}.`,
    });
  }
  return product;
}
export function deleteProduct(id, actor) {
  const idx = state.products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  const [removed] = state.products.splice(idx, 1);
  recordAudit({
    entityType: "product",
    entityId: id,
    action: "deleted",
    user: actor,
    details: `Product ${removed.code || id} deleted.`,
  });
  return true;
}

// --- Documents ---
export function listDocuments(productId) {
  return productId ? state.documents.filter((d) => d.productId === productId) : state.documents;
}
export function getDocument(id) {
  return state.documents.find((d) => d.id === id);
}
export function createDocument(data, actor) {
  const doc = {
    id: `DOC-${nextId("document")}`,
    uploadedAt: new Date().toISOString(),
    ...data,
  };
  state.documents.push(doc);
  recordAudit({
    entityType: "document",
    entityId: doc.id,
    action: "uploaded",
    user: actor,
    details: `Document "${doc.name}" uploaded for ${doc.productId}.`,
  });
  return doc;
}
export function deleteDocument(id, actor) {
  const idx = state.documents.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  const [removed] = state.documents.splice(idx, 1);
  recordAudit({
    entityType: "document",
    entityId: id,
    action: "deleted",
    user: actor,
    details: `Document "${removed.name}" deleted.`,
  });
  return true;
}

// --- Change Requests ---
export function listChangeRequests(productId) {
  return productId
    ? state.changeRequests.filter((c) => c.productId === productId)
    : state.changeRequests;
}
export function getChangeRequest(id) {
  return state.changeRequests.find((c) => c.id === id);
}
export function createChangeRequest(data, actor) {
  const cr = {
    id: `ECR-${nextId("changeRequest")}`,
    status: "draft",
    priority: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    ...data,
  };
  state.changeRequests.push(cr);
  recordAudit({
    entityType: "changeRequest",
    entityId: cr.id,
    action: "created",
    user: actor,
    details: `Change request "${cr.title}" created for ${cr.productId}.`,
  });
  return cr;
}
export function updateChangeRequest(id, patch, actor) {
  const cr = getChangeRequest(id);
  if (!cr) return null;
  const before = { ...cr };
  const resolvedStatuses = ["approved", "rejected", "implemented"];
  const nextPatch = { ...patch, updatedAt: new Date().toISOString() };
  if (patch.status && resolvedStatuses.includes(patch.status) && !cr.resolvedAt) {
    nextPatch.resolvedAt = new Date().toISOString();
  }
  Object.assign(cr, nextPatch);
  const changedFields = Object.keys(patch).filter((k) => before[k] !== cr[k]);
  if (changedFields.length) {
    recordAudit({
      entityType: "changeRequest",
      entityId: cr.id,
      action: changedFields.includes("status") ? "status_changed" : "updated",
      user: actor,
      details: `Updated fields: ${changedFields.join(", ")}.`,
    });
  }
  return cr;
}

// --- Audit ---
export function listAudit(filter = {}) {
  return state.auditLog.filter((entry) => {
    if (filter.entityType && entry.entityType !== filter.entityType) return false;
    if (filter.entityId && entry.entityId !== filter.entityId) return false;
    return true;
  });
}

export default state;
