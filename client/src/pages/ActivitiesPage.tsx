import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Account, Activity, SalesUser } from "../types";

const TYPES = ["Task", "Call", "Meeting", "Email", "Demo", "Proposal"];

export function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<SalesUser[]>([]);
  const [type, setType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ accountId: "", activityType: "Task", subject: "", description: "", ownerId: "", activityDate: new Date().toISOString().slice(0, 10) });

  function load() {
    api.getActivities(type ? { type } : undefined).then(setActivities);
  }

  useEffect(load, [type]);
  useEffect(() => {
    api.getAccounts().then(setAccounts);
    api.getSalesUsers().then(setUsers);
  }, []);

  async function createActivity(e: React.FormEvent) {
    e.preventDefault();
    await api.createActivity(form);
    setShowForm(false);
    setForm({ accountId: "", activityType: "Task", subject: "", description: "", ownerId: "", activityDate: new Date().toISOString().slice(0, 10) });
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Activities</h1>
          <div className="page-subtitle">Tasks, calls, meetings, emails and follow-ups across all accounts</div>
        </div>
        <button className="primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Log Activity"}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} onSubmit={createActivity}>
          <select required value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.accountId} value={a.accountId}>
                {a.accountName}
              </option>
            ))}
          </select>
          <select value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value })}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select required value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
            <option value="">Owner</option>
            {users.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.name}
              </option>
            ))}
          </select>
          <input placeholder="Subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={{ gridColumn: "span 2" }} />
          <input type="date" value={form.activityDate} onChange={(e) => setForm({ ...form, activityDate: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ gridColumn: "span 3" }} rows={2} />
          <button className="primary" type="submit">
            Save Activity
          </button>
        </form>
      )}

      <div className="toolbar">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="timeline">
          {activities.map((a) => (
            <div className="timeline-item" key={a.activityId}>
              <div className="timeline-date">
                {a.activityDate} · {a.activityType} · {a.ownerName}
              </div>
              <div className="timeline-subject">{a.subject}</div>
              {a.description && <div className="timeline-desc">{a.description}</div>}
              <div className="stat-note" style={{ marginTop: 3 }}>
                <Link to={`/customers/accounts/${a.accountId}`}>{a.accountName}</Link>
                {a.opportunityName ? ` · ${a.opportunityName}` : ""}
              </div>
            </div>
          ))}
          {activities.length === 0 && <div className="empty-state">No activities recorded.</div>}
        </div>
      </div>
    </div>
  );
}
