import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { LifecycleBadge, ComplianceBadge } from "../components/StatusBadge";
import type { LifecycleStage, ComplianceStatus, Product } from "../types";

const CATEGORIES = ["Electronics", "Mechanical", "Software", "Packaging", "Chemical"];
const STAGES: LifecycleStage[] = ["concept", "design", "active", "phase_out", "end_of_life", "obsolete"];
const COMPLIANCE: ComplianceStatus[] = ["compliant", "pending_review", "non_compliant", "not_applicable"];

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState("");
  const [compliance, setCompliance] = useState("");

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .listProducts({ q, category, lifecycleStage: stage, complianceStatus: compliance })
        .then(setProducts)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [q, category, stage, compliance]);

  return (
    <div>
      <div className="toolbar">
        <input
          placeholder="Search by name, code, tag..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={stage} onChange={(e) => setStage(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <select value={compliance} onChange={(e) => setCompliance(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All compliance statuses</option>
          {COMPLIANCE.map((c) => (
            <option key={c} value={c}>{c.replace("_", " ")}</option>
          ))}
        </select>
        <div className="spacer" />
        <span className="muted text-sm">{products.length} product(s)</span>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">No products match these filters.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Owner</th>
                <th>Stage</th>
                <th>Compliance</th>
                <th>EOL Date</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="clickable">
                  <td>
                    <Link to={`/products/${p.id}`}>{p.name}</Link>
                    <div className="muted text-sm">{p.code}</div>
                  </td>
                  <td>{p.category}</td>
                  <td>{p.owner || <span className="badge red">Unassigned</span>}</td>
                  <td>
                    <LifecycleBadge stage={p.lifecycleStage} />
                  </td>
                  <td>
                    <ComplianceBadge status={p.complianceStatus} />
                  </td>
                  <td>{p.eolDate || <span className="muted">&mdash;</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
