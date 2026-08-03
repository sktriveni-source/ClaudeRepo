import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Account, Contact } from "../types";
import { Modal } from "../components/Modal";

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  function reload() {
    api.listContacts().then(setContacts);
  }
  useEffect(reload, []);
  useEffect(() => {
    api.listAccounts().then(setAccounts);
  }, []);

  const accountName = (id: string | null) => accounts.find((a) => a.id === id)?.name || "—";

  const filtered = q
    ? contacts.filter((c) => [c.firstName, c.lastName, c.email].join(" ").toLowerCase().includes(q.toLowerCase()))
    : contacts;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Contacts</h1>
          <p className="page-subtitle">People at your accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          + New Contact
        </button>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search contacts…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">No contacts yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Account</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}>
                  <td>
                    {c.firstName} {c.lastName}
                  </td>
                  <td>{c.title || "—"}</td>
                  <td>{accountName(c.accountId)}</td>
                  <td>{c.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <NewContactModal
          accounts={accounts}
          onClose={() => setShowNew(false)}
          onCreated={(c) => {
            setShowNew(false);
            navigate(`/contacts/${c.id}`);
          }}
        />
      )}
    </div>
  );
}

function NewContactModal({
  accounts,
  onClose,
  onCreated,
}: {
  accounts: Account[];
  onClose: () => void;
  onCreated: (c: Contact) => void;
}) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", title: "", accountId: "", owner: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName) {
      setError("First and last name are required.");
      return;
    }
    setSaving(true);
    try {
      const contact = await api.createContact({
        ...form,
        accountId: form.accountId || null,
        owner: form.owner || "Unassigned",
      });
      onCreated(contact);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="New Contact"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Create Contact"}
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
            <label>Account</label>
            <select className="input" value={form.accountId} onChange={(e) => set("accountId", e.target.value)}>
              <option value="">— None —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Title</label>
            <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} />
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
        </div>
      </form>
    </Modal>
  );
}
