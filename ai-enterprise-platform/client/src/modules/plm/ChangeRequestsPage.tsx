import { useState } from "react";
import TopBar from "../../components/TopBar";
import Badge from "../../components/Badge";
import { useApi } from "../../hooks/useApi";
import { plmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

const STATUSES = ["Open", "In Review", "Approved", "Rejected", "Implemented"];

export default function ChangeRequestsPage() {
  const { data, loading, error, reload } = useApi(() => plmApi.listChangeRequests(), []);
  const products = useApi(() => plmApi.listProducts(), []);
  const [statusFilter, setStatusFilter] = useState("");

  async function advanceStatus(id: string, current: string) {
    const idx = STATUSES.indexOf(current);
    const next = STATUSES[Math.min(idx + 1, STATUSES.length - 1)];
    await plmApi.updateChangeRequest(id, { status: next, changedBy: "Product Manager" });
    reload();
  }

  const filtered = data ? (statusFilter ? data.filter((c) => c.status === statusFilter) : data) : [];

  return (
    <>
      <TopBar title="Change Requests" subtitle="PLM · Change Management" />
      <div className="content">
        <div className="filter-bar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}

        {filtered.length > 0 && (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Product</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Requested By</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((cr) => {
                  const product = products.data?.find((p) => p.id === cr.productId);
                  return (
                    <tr key={cr.id}>
                      <td>
                        <strong>{cr.title}</strong>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{cr.description}</div>
                      </td>
                      <td>{product ? product.name : cr.productId}</td>
                      <td><Badge>{cr.priority}</Badge></td>
                      <td><Badge>{cr.status}</Badge></td>
                      <td>{cr.requestedBy}</td>
                      <td>
                        {cr.status !== "Implemented" && cr.status !== "Rejected" && (
                          <button className="btn" onClick={() => advanceStatus(cr.id, cr.status)}>
                            Advance →
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
