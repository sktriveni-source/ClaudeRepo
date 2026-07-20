import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { DataSource, Domain } from "../types";
import Badge from "../components/Badge";

const EMPTY_FORM = { name: "", type: "API", connector: "REST / API Key", endpoint: "", domain: "suppliers" as Domain };

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => api.dataSources().then(setSources);

  useEffect(() => {
    load();
  }, []);

  async function handleSync(id: string) {
    setBusyId(id);
    await api.syncDataSource(id);
    await load();
    setBusyId(null);
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.endpoint) return;
    await api.addDataSource(form);
    setForm(EMPTY_FORM);
    setShowForm(false);
    await load();
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Data Source Connections</h1>
          <p className="page-subtitle">Databases and APIs feeding the golden record store.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Connect Source"}
        </button>
      </header>

      {showForm && (
        <form className="card form-card" onSubmit={handleConnect}>
          <div className="form-row">
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Workday HCM" required />
            </label>
            <label>
              Type
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="API">API</option>
                <option value="Database">Database</option>
              </select>
            </label>
            <label>
              Domain
              <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value as Domain })}>
                <option value="suppliers">Suppliers</option>
                <option value="customers">Customers</option>
                <option value="products">Products</option>
              </select>
            </label>
          </div>
          <label>
            Endpoint / Connection string
            <input value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} placeholder="https://... or jdbc:..." required />
          </label>
          <button className="btn-primary" type="submit">Save Connection</button>
        </form>
      )}

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Domain</th>
              <th>Status</th>
              <th>Records</th>
              <th>Last Sync</th>
              <th>Frequency</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="cell-primary">{s.name}</div>
                  <div className="cell-secondary">{s.endpoint}</div>
                </td>
                <td>{s.type}</td>
                <td className="capitalize">{s.domain}</td>
                <td><Badge tone={s.status}>{s.status}</Badge></td>
                <td>{s.recordCount}</td>
                <td>{new Date(s.lastSyncAt).toLocaleString()}</td>
                <td>{s.syncFrequency}</td>
                <td>
                  <button className="btn-secondary" disabled={busyId === s.id} onClick={() => handleSync(s.id)}>
                    {busyId === s.id ? "Syncing…" : "Sync now"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
