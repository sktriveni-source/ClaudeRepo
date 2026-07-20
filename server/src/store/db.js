import { dataSources } from "../data/dataSources.js";
import { suppliers } from "../data/suppliers.js";
import { customers } from "../data/customers.js";
import { products } from "../data/products.js";
import { rules as seedRules, nextRuleId } from "../data/rules.js";

// A single in-memory store standing in for the platform's metadata + golden
// record repository. No external DB required — mirrors the pattern used by
// the other demo apps in this workspace so the app runs anywhere Node runs.
const state = {
  dataSources: dataSources.map((s) => ({ ...s })),
  records: {
    suppliers: suppliers.map((r) => ({ ...r })),
    customers: customers.map((r) => ({ ...r })),
    products: products.map((r) => ({ ...r })),
  },
  rules: seedRules.map((r) => ({ ...r })),
  issues: [],
  duplicateClusters: { suppliers: [], customers: [], products: [] },
  approvals: [],
  auditLog: [],
  nextIssueId: 1,
  nextApprovalId: 1,
  nextClusterId: 1,
};

export const DOMAINS = ["suppliers", "customers", "products"];

export function getDataSources() {
  return state.dataSources;
}

export function getDataSource(id) {
  return state.dataSources.find((s) => s.id === id);
}

export function addDataSource(source) {
  const record = {
    id: `src-${Date.now().toString(36)}`,
    status: "connected",
    lastSyncAt: new Date().toISOString(),
    ...source,
  };
  state.dataSources.push(record);
  logAudit("data_source.connected", { sourceId: record.id, name: record.name });
  return record;
}

export function touchDataSourceSync(id) {
  const src = getDataSource(id);
  if (src) src.lastSyncAt = new Date().toISOString();
  return src;
}

export function getRecords(domain) {
  return state.records[domain] || [];
}

export function getRecord(domain, id) {
  return getRecords(domain).find((r) => r.id === id);
}

export function updateRecord(domain, id, patch) {
  const rec = getRecord(domain, id);
  if (!rec) return null;
  Object.assign(rec, patch);
  return rec;
}

export function deleteRecord(domain, id) {
  const list = state.records[domain];
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}

export function getRules(domain) {
  return domain ? state.rules.filter((r) => r.domain === domain) : state.rules;
}

export function addRule(rule) {
  const record = { id: nextRuleId(), source: "manual", ...rule };
  state.rules.push(record);
  logAudit("rule.created", { ruleId: record.id, domain: record.domain, field: record.field });
  return record;
}

export function deleteRule(id) {
  const idx = state.rules.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  state.rules.splice(idx, 1);
  return true;
}

export function clearIssuesFromRun(domain, category) {
  state.issues = state.issues.filter((i) => !(i.domain === domain && i.category === category));
}

export function addIssue(issue) {
  const record = {
    id: `iss-${String(state.nextIssueId++).padStart(4, "0")}`,
    status: "open",
    createdAt: new Date().toISOString(),
    ...issue,
  };
  state.issues.push(record);
  return record;
}

export function getIssues(filters = {}) {
  return state.issues.filter((i) => {
    if (filters.domain && i.domain !== filters.domain) return false;
    if (filters.status && i.status !== filters.status) return false;
    if (filters.severity && i.severity !== filters.severity) return false;
    if (filters.category && i.category !== filters.category) return false;
    return true;
  });
}

export function getIssue(id) {
  return state.issues.find((i) => i.id === id);
}

export function updateIssue(id, patch) {
  const issue = getIssue(id);
  if (!issue) return null;
  Object.assign(issue, patch);
  return issue;
}

export function setDuplicateClusters(domain, clusters) {
  state.duplicateClusters[domain] = clusters;
}

export function getDuplicateClusters(domain) {
  return domain ? state.duplicateClusters[domain] || [] : state.duplicateClusters;
}

export function getDuplicateCluster(domain, clusterId) {
  return (state.duplicateClusters[domain] || []).find((c) => c.id === clusterId);
}

export function nextClusterId() {
  return `dup-${String(state.nextClusterId++).padStart(4, "0")}`;
}

export function addApproval(approval) {
  const record = {
    id: `apr-${String(state.nextApprovalId++).padStart(4, "0")}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    ...approval,
  };
  state.approvals.push(record);
  return record;
}

export function getApprovals(filters = {}) {
  return state.approvals.filter((a) => {
    if (filters.status && a.status !== filters.status) return false;
    if (filters.type && a.type !== filters.type) return false;
    return true;
  });
}

export function getApproval(id) {
  return state.approvals.find((a) => a.id === id);
}

export function updateApproval(id, patch) {
  const approval = getApproval(id);
  if (!approval) return null;
  Object.assign(approval, patch);
  return approval;
}

export function logAudit(action, details) {
  state.auditLog.unshift({
    id: `aud-${state.auditLog.length + 1}`,
    action,
    details,
    at: new Date().toISOString(),
  });
  if (state.auditLog.length > 500) state.auditLog.length = 500;
}

export function getAuditLog(limit = 50) {
  return state.auditLog.slice(0, limit);
}

export default state;
