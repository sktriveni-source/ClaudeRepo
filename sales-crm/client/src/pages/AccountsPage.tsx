import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Account } from "../types";
import { Modal } from "../components/Modal";

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  function reload() {
    api.listAccounts().then(setAccounts);
  }
  useEffect(reload, []);

  const filtered = q ? accounts.filter((a) => a.name.toLowerCase().includes(q.toLowerCase())) : accounts;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Accounts</h1>
          <p className="page-subtitle">Companies you sell to, centrally tracked.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          + New Account
        </button>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search accounts…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">No accounts yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Industry</th>
                <th>City</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => navigate(`/accounts/${a.id}`)}>
                  <td>{a.name}</td>
                  <td>{a.industry}</td>
                  <td>{a.billingCity || "—"}</td>
                  <td>{a.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <NewAccountModal
          onClose={() => setShowNew(false)}
          onCreated={(a) => {
            setShowNew(false);
            navigate(`/accounts/${a.id}`);
          }}
        />
      )}
    </div>
  );
}

function NewAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: (a: Account) => void }) {
  const [form, setForm] = useState({ name: "", industry: "Technology", website: "", phone: "", billingCity: "", billingCountry: "", owner: "" });
  const [industries, setIndustries] = useState<string[]>(["Technology"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.industries().then((r) => setIndustries(r.industries));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name) {
      setError("Account name is required.");
      return;
    }
    setSaving(true);
    try {
      const account = await api.createAccount({ ...form, owner: form.owner || "Unassigned" });
      onCreated(account);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="New Account"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Create Account"}
          </button>
        </>
      }
    >
      <form onSubmit={submit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-grid">
          <div className="field full">
            <label>Account name</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="field">
            <label>Industry</label>
            <select className="input" value={form.industry} onChange={(e) => set("industry", e.target.value)}>
              {industries.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Website</label>
            <input className="input" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="field">
            <label>Owner</label>
            <input className="input" value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Unassigned" />
          </div>
          <div className="field">
            <label>City</label>
            <input className="input" value={form.billingCity} onChange={(e) => set("billingCity", e.target.value)} />
          </div>
          <div className="field">
            <label>Country</label>
            <input className="input" value={form.billingCountry} onChange={(e) => set("billingCountry", e.target.value)} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
