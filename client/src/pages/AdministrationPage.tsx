import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AuditRecord, SalesUser } from "../types";

export function AdministrationPage() {
  const [users, setUsers] = useState<SalesUser[]>([]);
  const [audit, setAudit] = useState<AuditRecord[]>([]);

  useEffect(() => {
    api.getSalesUsers().then(setUsers);
    api.getAudit().then(setAudit);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Administration</h1>
          <div className="page-subtitle">Users, roles and system audit trail</div>
        </div>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>
          Users &amp; Roles
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Region</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId}>
                <td>{u.name}</td>
                <td>{u.role}</td>
                <td>{u.region}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="section-title" style={{ marginTop: 0 }}>
          Audit History
        </div>
        {audit.length === 0 ? (
          <div className="empty-state">No audit entries yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Entity</th>
                <th>Action</th>
                <th>Change</th>
                <th>Changed By</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.auditId}>
                  <td>{a.changedDate}</td>
                  <td>
                    {a.entityType} {a.entityId}
                  </td>
                  <td>{a.action}</td>
                  <td className="stat-note">
                    {a.oldValue && a.newValue ? `${a.oldValue} → ${a.newValue}` : a.newValue || a.oldValue}
                  </td>
                  <td>{a.changedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
