import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { PriorityBadge } from "../components/StatusBadge";
import type { ChangeRequest, Product } from "../types";
import { CR_LABELS } from "../components/StatusBadge";

const COLUMNS: ChangeRequest["status"][] = ["draft", "submitted", "in_review", "approved", "rejected", "implemented"];

export function ChangeRequestsPage() {
  const [crs, setCrs] = useState<ChangeRequest[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listChangeRequests(), api.listProducts()])
      .then(([crList, productList]) => {
        setCrs(crList);
        setProducts(Object.fromEntries(productList.map((p) => [p.id, p])));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state">Loading change requests...</div>;

  return (
    <div>
      <div className="toolbar">
        <span className="muted text-sm">{crs.length} change request(s) across all products</span>
      </div>
      <div className="kanban">
        {COLUMNS.map((status) => (
          <div key={status} className="kanban-col">
            <h3>{CR_LABELS[status]} ({crs.filter((c) => c.status === status).length})</h3>
            {crs
              .filter((c) => c.status === status)
              .map((cr) => (
                <div key={cr.id} className="kanban-card">
                  <div className="cr-title">{cr.title}</div>
                  <div className="muted" style={{ marginBottom: 6 }}>
                    <Link to={`/products/${cr.productId}`}>{products[cr.productId]?.name || cr.productId}</Link>
                  </div>
                  <div className="flex-row" style={{ justifyContent: "space-between" }}>
                    <PriorityBadge priority={cr.priority} />
                    <span className="muted">{cr.requestedBy}</span>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
