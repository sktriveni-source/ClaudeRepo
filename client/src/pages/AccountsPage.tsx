import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Account } from "../types";

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ accountName: "", industry: "", country: "", region: "Europe", customerSegment: "Mid-Market" });

  function load() {
    api.getAccounts(q ? { q } : undefined).then(setAccounts);
  }

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    await api.createAccount({ ...form, customerStatus: "Prospect" });
    setShowForm(false);
    setForm({ accountName: "", industry: "", country: "", region: "Europe", customerSegment: "Mid-Market" });
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Accounts</h1>
          <div className="page-subtitle">{accounts.length} accounts</div>
        </div>
        <button className="primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New Account"}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: 18, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }} onSubmit={createAccount}>
          <input placeholder="Account name" required value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
          <input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
            <option>Europe</option>
            <option>Americas</option>
            <option>APAC</option>
          </select>
          <select value={form.customerSegment} onChange={(e) => setForm({ ...form, customerSegment: e.target.value })}>
            <option>Enterprise</option>
            <option>Mid-Market</option>
            <option>SMB</option>
          </select>
          <button className="primary" type="submit">
            Save Account
          </button>
        </form>
      )}

      <div className="toolbar">
        <input type="search" placeholder="Search accounts…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Industry</th>
              <th>Region</th>
              <th>Segment</th>
              <th>Status</th>
              <th>Account Manager</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.accountId}>
                <td>
                  <Link to={`/customers/accounts/${a.accountId}`}>{a.accountName}</Link>
                </td>
                <td>{a.industry}</td>
                <td>{a.region}</td>
                <td>{a.customerSegment}</td>
                <td>{a.customerStatus}</td>
                <td>{a.accountManagerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
