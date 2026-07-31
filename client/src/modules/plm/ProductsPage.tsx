import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Badge from "../../components/Badge";
import { useApi } from "../../hooks/useApi";
import { plmApi } from "../../api/client";
import { LoadingState, ErrorState, EmptyState } from "../../components/StateMessages";

export default function ProductsPage() {
  const { data, loading, error } = useApi(() => plmApi.listProducts(), []);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesStage = !stage || p.lifecycleStage === stage;
      return matchesSearch && matchesStage;
    });
  }, [data, search, stage]);

  return (
    <>
      <TopBar title="Products" subtitle="PLM · Product Repository" />
      <div className="content">
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">All lifecycle stages</option>
            <option value="Concept">Concept</option>
            <option value="Active">Active</option>
            <option value="Phase-Out">Phase-Out</option>
            <option value="End of Life">End of Life</option>
          </select>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {data && filtered.length === 0 && <EmptyState message="No products match your filters." />}

        {filtered.length > 0 && (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Lifecycle Stage</th>
                  <th>Compliance</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="clickable" onClick={() => navigate(`/plm/products/${p.id}`)}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>{p.sku}</td>
                    <td>{p.category}</td>
                    <td>
                      <Badge>{p.lifecycleStage}</Badge>
                    </td>
                    <td>
                      <Badge>{p.complianceStatus}</Badge>
                    </td>
                    <td>{p.owner}</td>
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
