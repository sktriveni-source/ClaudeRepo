import {
  TODAY,
  salesUsers,
  products,
  accounts,
  contacts,
  leads,
  opportunities,
  activities,
  salesTargets,
  aiInsights,
  auditHistory,
  nextId,
} from "../data/seed.js";

export const db = {
  salesUsers,
  products,
  accounts,
  contacts,
  leads,
  opportunities,
  activities,
  salesTargets,
  aiInsights,
  auditHistory,
};

export { TODAY, nextId };

export function findById(collection, idField, id) {
  return db[collection].find((item) => item[idField] === id);
}

export function recordAudit({ entityType, entityId, action, oldValue, newValue, changedBy }) {
  db.auditHistory.push({
    auditId: nextId("AU"),
    entityType,
    entityId,
    action,
    oldValue: oldValue ?? "",
    newValue: newValue ?? "",
    changedBy: changedBy || "system",
    changedDate: new Date().toISOString().slice(0, 10),
  });
}

export function recordInsight({ entityType, entityId, insightType, insight, confidenceScore }) {
  const record = {
    insightId: nextId("AI"),
    entityType,
    entityId,
    insightType,
    insight,
    confidenceScore,
    createdDate: new Date().toISOString(),
  };
  db.aiInsights.push(record);
  return record;
}

export function userName(userId) {
  return db.salesUsers.find((u) => u.userId === userId)?.name || userId;
}

export function daysBetween(dateStr, reference = TODAY) {
  const d = new Date(dateStr);
  const ref = new Date(reference);
  return Math.round((ref - d) / (1000 * 60 * 60 * 24));
}
