import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Badge from "../../components/Badge";
import { useApi } from "../../hooks/useApi";
import { crmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

export default function AccountsPage() {
  const { data, loading, error } = useApi(() => crmApi.listAccounts(), []);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = (data || []).filter((a) => a.accountName.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <TopBar title="Accounts" subtitle="CRM · Customers" />
      <div className="content">
        <div className="filter-bar">
          <input type="search" placeholder="Search accounts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {filtered.length > 0 && (
          <div className="card">
            <table className="data-table">
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
                {filtered.map((a) => (
                  <tr key={a.id} className="clickable" onClick={() => navigate(`/crm/accounts/${a.id}`)}>
                    <td><strong>{a.accountName}</strong></td>
                    <td>{a.industry}</td>
                    <td>{a.region}</td>
                    <td>{a.customerSegment}</td>
                    <td><Badge>{a.customerStatus}</Badge></td>
                    <td>{a.accountManager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
