import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Account, Opportunity, SalesUser } from "../types";
import { money } from "../components/KpiCard";
import { RiskBadge, StageBadge } from "../components/StatusBadge";

const STAGES = ["Prospecting", "Qualification", "Needs Analysis", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

export function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<SalesUser[]>([]);
  const [stage, setStage] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ opportunityName: "", accountId: "", ownerId: "", estimatedValue: "100000", probability: "20", expectedCloseDate: "" });

  function load() {
    const params: Record<string, string> = {};
    if (stage) params.stage = stage;
    if (ownerId) params.ownerId = ownerId;
    api.getOpportunities(params).then(setOpportunities);
  }

  useEffect(load, [stage, ownerId]);
  useEffect(() => {
    api.getAccounts().then(setAccounts);
    api.getSalesUsers().then(setUsers);
  }, []);

  async function createOpportunity(e: React.FormEvent) {
    e.preventDefault();
    await api.createOpportunity({
      ...form,
      estimatedValue: Number(form.estimatedValue) as unknown as number,
      probability: Number(form.probability) as unknown as number,
    });
    setShowForm(false);
    setForm({ opportunityName: "", accountId: "", ownerId: "", estimatedValue: "100000", probability: "20", expectedCloseDate: "" });
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Opportunities</h1>
          <div className="page-subtitle">{opportunities.length} opportunities</div>
        </div>
        <button className="primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New Opportunity"}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} onSubmit={createOpportunity}>
          <input placeholder="Opportunity name" required value={form.opportunityName} onChange={(e) => setForm({ ...form, opportunityName: e.target.value })} />
          <select required value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.accountId} value={a.accountId}>
                {a.accountName}
              </option>
            ))}
          </select>
          <select required value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
            <option value="">Sales owner</option>
            {users.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.name}
              </option>
            ))}
          </select>
          <input type="number" placeholder="Estimated value" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} />
          <input type="number" placeholder="Probability %" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} />
          <input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
          <button className="primary" type="submit">
            Save Opportunity
          </button>
        </form>
      )}

      <div className="toolbar">
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          <option value="">All owners</option>
          {users.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Opportunity</th>
              <th>Account</th>
              <th>Stage</th>
              <th>Value</th>
              <th>Weighted</th>
              <th>Close Date</th>
              <th>Owner</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o.opportunityId}>
                <td>
                  <Link to={`/sales/opportunities/${o.opportunityId}`}>{o.opportunityName}</Link>
                </td>
                <td>{o.accountName}</td>
                <td>
                  <StageBadge stage={o.stage} />
                </td>
                <td>{money(o.estimatedValue)}</td>
                <td>{money(o.weightedRevenue || 0)}</td>
                <td>{o.expectedCloseDate}</td>
                <td>{o.ownerName}</td>
                <td>{o.status === "Open" ? <RiskBadge level={o.riskLevel || "Low"} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
