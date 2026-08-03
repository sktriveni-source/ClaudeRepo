import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Lead } from "../types";
import { StageBadge } from "../components/StageBadge";
import { Modal } from "../components/Modal";

const STATUS_FILTERS = ["All", "New", "Nurturing", "Converted", "Disqualified"];

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  function reload() {
    api.listLeads(statusFilter === "All" ? undefined : { status: statusFilter }).then(setLeads);
  }

  useEffect(reload, [statusFilter]);

  const filtered = q
    ? leads.filter((l) =>
        [l.firstName, l.lastName, l.company, l.email].join(" ").toLowerCase().includes(q.toLowerCase())
      )
    : leads;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Leads</h1>
          <p className="page-subtitle">Capture and nurture engagement before conversion.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          + New Lead
        </button>
      </div>

      <div className="toolbar">
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_FILTERS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input className="input" placeholder="Search leads…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">No leads match this view.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Source</th>
                <th>Status</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} onClick={() => navigate(`/leads/${l.id}`)}>
                  <td>
                    {l.firstName} {l.lastName}
                  </td>
                  <td>{l.company}</td>
                  <td>{l.source}</td>
                  <td>
                    <StageBadge value={l.status} />
                  </td>
                  <td>{l.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <NewLeadModal
          onClose={() => setShowNew(false)}
          onCreated={(lead) => {
            setShowNew(false);
            navigate(`/leads/${lead.id}`);
          }}
        />
      )}
    </div>
  );
}

function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (lead: Lead) => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    title: "",
    email: "",
    phone: "",
    source: "Web",
    owner: "",
    notes: "",
  });
  const [sources, setSources] = useState<string[]>(["Web"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.leadSources().then((r) => setSources(r.sources));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.firstName || !form.lastName || !form.company) {
      setError("First name, last name and company are required.");
      return;
    }
    setSaving(true);
    try {
      const lead = await api.createLead({ ...form, owner: form.owner || "Unassigned" });
      onCreated(lead);
    } catch (err: any) {
      setError(err.message || "Failed to create lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="New Lead"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Create Lead"}
          </button>
        </>
      }
    >
      <form onSubmit={submit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-grid">
          <div className="field">
            <label>First name</label>
            <input className="input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </div>
          <div className="field">
            <label>Last name</label>
            <input className="input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </div>
          <div className="field full">
            <label>Company</label>
            <input className="input" value={form.company} onChange={(e) => set("company", e.target.value)} />
          </div>
          <div className="field">
            <label>Title</label>
            <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="field">
            <label>Source</label>
            <select className="input" value={form.source} onChange={(e) => set("source", e.target.value)}>
              {sources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="field">
            <label>Owner</label>
            <input className="input" value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Unassigned" />
          </div>
          <div className="field full">
            <label>Notes</label>
            <textarea className="input" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
