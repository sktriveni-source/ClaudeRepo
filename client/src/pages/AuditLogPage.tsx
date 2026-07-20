import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AuditEntry } from "../types";

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.audit({ entityType }).then(setEntries).finally(() => setLoading(false));
  }, [entityType]);

  return (
    <div>
      <div className="toolbar">
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All entities</option>
          <option value="product">Products</option>
          <option value="document">Documents</option>
          <option value="changeRequest">Change Requests</option>
        </select>
        <div className="spacer" />
        <span className="muted text-sm">{entries.length} entries</span>
      </div>
      <div className="card">
        {loading ? (
          <div className="empty-state">Loading audit history...</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">No audit entries found.</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="issue-row">
              <div style={{ minWidth: 160 }} className="muted text-sm">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
              <div>
                <span className="badge neutral">{entry.entityType}</span>{" "}
                <span className="badge blue">{entry.action.replace("_", " ")}</span>{" "}
                <span className="muted text-sm">{entry.entityId}</span>
                <div className="text-sm" style={{ marginTop: 3 }}>{entry.details}</div>
                <div className="muted text-sm">by {entry.user}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
