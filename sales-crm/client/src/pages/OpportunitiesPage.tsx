import { DragEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Account, Contact, Opportunity, StageMeta } from "../types";
import { Modal } from "../components/Modal";

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stages, setStages] = useState<StageMeta[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function reload() {
    api.listOpportunities().then(setOpportunities);
  }
  useEffect(reload, []);
  useEffect(() => {
    api.opportunityStages().then((r) => setStages(r.stages));
    api.listAccounts().then(setAccounts);
  }, []);

  async function moveTo(oppId: string, stage: string) {
    setError("");
    try {
      await api.changeOpportunityStage(oppId, stage);
      reload();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function onDragStart(e: DragEvent, oppId: string) {
    e.dataTransfer.setData("text/plain", oppId);
  }

  function onDrop(e: DragEvent, stage: string) {
    e.preventDefault();
    setDragOverStage(null);
    const oppId = e.dataTransfer.getData("text/plain");
    if (oppId) moveTo(oppId, stage);
  }

  const total = opportunities.reduce((s, o) => s + o.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Opportunity Pipeline</h1>
          <p className="page-subtitle">
            {opportunities.length} opportunities · {currency(total)} total value · drag cards to advance stage
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          + New Opportunity
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="kanban">
        {stages.map((stage) => {
          const items = opportunities.filter((o) => o.stage === stage.key);
          const stageTotal = items.reduce((s, o) => s + o.amount, 0);
          return (
            <div
              key={stage.key}
              className={`kanban-column${dragOverStage === stage.key ? " drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage.key);
              }}
              onDragLeave={() => setDragOverStage((s) => (s === stage.key ? null : s))}
              onDrop={(e) => onDrop(e, stage.key)}
            >
              <div className="kanban-column-header">
                <span>{stage.label}</span>
                <span className="count">{items.length}</span>
              </div>
              <div className="kanban-column-body">
                {items.length === 0 && <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "6px 2px" }}>No deals</div>}
                {items.map((o) => (
                  <div
                    key={o.id}
                    className="kanban-card"
                    draggable
                    onDragStart={(e) => onDragStart(e, o.id)}
                    onClick={() => navigate(`/opportunities/${o.id}`)}
                  >
                    <div className="name">{o.name}</div>
                    <div className="amount">{currency(o.amount)}</div>
                    <div className="meta">
                      {o.owner}
                      {o.closeDate ? ` · closes ${o.closeDate}` : ""}
                    </div>
                  </div>
                ))}
                {items.length > 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "4px 2px", fontWeight: 600 }}>
                    {currency(stageTotal)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showNew && (
        <NewOpportunityModal
          accounts={accounts}
          onClose={() => setShowNew(false)}
          onCreated={(o) => {
            setShowNew(false);
            navigate(`/opportunities/${o.id}`);
          }}
        />
      )}
    </div>
  );
}

function NewOpportunityModal({
  accounts,
  onClose,
  onCreated,
}: {
  accounts: Account[];
  onClose: () => void;
  onCreated: (o: Opportunity) => void;
}) {
  const [form, setForm] = useState({ name: "", accountId: "", contactId: "", amount: "0", closeDate: "", owner: "" });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (form.accountId) {
      api.listContacts({ accountId: form.accountId }).then(setContacts);
    } else {
      setContacts([]);
    }
  }, [form.accountId]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.accountId) {
      setError("Name and account are required.");
      return;
    }
    setSaving(true);
    try {
      const opp = await api.createOpportunity({
        name: form.name,
        accountId: form.accountId,
        contactId: form.contactId || null,
        amount: Number(form.amount) || 0,
        closeDate: form.closeDate || null,
        owner: form.owner || "Unassigned",
      });
      onCreated(opp);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="New Opportunity"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Create Opportunity"}
          </button>
        </>
      }
    >
      <form onSubmit={submit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-grid">
          <div className="field full">
            <label>Opportunity name</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="field">
            <label>Account</label>
            <select className="input" value={form.accountId} onChange={(e) => set("accountId", e.target.value)}>
              <option value="">Select account…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Contact</label>
            <select className="input" value={form.contactId} onChange={(e) => set("contactId", e.target.value)} disabled={!form.accountId}>
              <option value="">— None —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Amount (USD)</label>
            <input className="input" type="number" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
          </div>
          <div className="field">
            <label>Expected close date</label>
            <input className="input" type="date" value={form.closeDate} onChange={(e) => set("closeDate", e.target.value)} />
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
