let sequence = 1;

export function nextId(prefix) {
  return `${prefix}-${String(sequence++).padStart(4, "0")}`;
}

const auditLog = [];

export function recordAudit({ entityType, entityId, action, changedBy, oldValue, newValue }) {
  auditLog.push({
    id: nextId("AUD"),
    entityType,
    entityId,
    action,
    changedBy: changedBy || "system",
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    changedDate: new Date().toISOString(),
  });
}

export function listAudit({ entityType, entityId } = {}) {
  return auditLog
    .filter((a) => (entityType ? a.entityType === entityType : true))
    .filter((a) => (entityId ? a.entityId === entityId : true))
    .sort((a, b) => new Date(b.changedDate) - new Date(a.changedDate));
}

/**
 * A tiny in-memory CRUD collection with automatic audit-log entries on
 * create/update, matching the AuditHistory entity described in the spec.
 */
export function createCollection(entityType, prefix, seed = []) {
  const items = new Map();
  for (const item of seed) {
    items.set(item.id, item);
  }

  return {
    entityType,
    list(predicate) {
      const all = Array.from(items.values());
      return predicate ? all.filter(predicate) : all;
    },
    get(id) {
      return items.get(id);
    },
    create(data, changedBy) {
      const id = data.id || nextId(prefix);
      const now = new Date().toISOString();
      const record = { id, createdDate: now, updatedDate: now, ...data, id };
      items.set(id, record);
      recordAudit({ entityType, entityId: id, action: "CREATE", changedBy, newValue: record });
      return record;
    },
    update(id, patch, changedBy) {
      const existing = items.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, id, updatedDate: new Date().toISOString() };
      items.set(id, updated);
      recordAudit({
        entityType,
        entityId: id,
        action: "UPDATE",
        changedBy,
        oldValue: existing,
        newValue: updated,
      });
      return updated;
    },
    remove(id, changedBy) {
      const existing = items.get(id);
      if (!existing) return false;
      items.delete(id);
      recordAudit({ entityType, entityId: id, action: "DELETE", changedBy, oldValue: existing });
      return true;
    },
  };
}
