import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { DuplicatePair } from "../types";

export function DuplicatesPage() {
  const { can } = useAuth();
  const [pairs, setPairs] = useState<DuplicatePair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!can("ai:insights")) {
      setLoading(false);
      return;
    }
    api.aiDuplicates().then(setPairs).finally(() => setLoading(false));
  }, [can]);

  if (!can("ai:insights")) {
    return <div className="card empty-state">Your role does not have access to AI duplicate detection.</div>;
  }
  if (loading) return <div className="empty-state">Scanning catalog for near-duplicate products...</div>;

  return (
    <div>
      <div className="toolbar">
        <span className="muted text-sm">
          {pairs.length} potential duplicate pair(s) detected by name, description, and tag similarity
        </span>
      </div>
      {pairs.length === 0 ? (
        <div className="card empty-state">No likely duplicates found.</div>
      ) : (
        pairs.map((pair, i) => (
          <div key={i} className="card section">
            <div className="toolbar" style={{ marginBottom: 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  <Link to={`/products/${pair.productA.id}`}>{pair.productA.name}</Link>
                </div>
                <div className="muted text-sm">{pair.productA.code}</div>
              </div>
              <div className="muted" style={{ fontSize: 20 }}>&harr;</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  <Link to={`/products/${pair.productB.id}`}>{pair.productB.name}</Link>
                </div>
                <div className="muted text-sm">{pair.productB.code}</div>
              </div>
              <div style={{ textAlign: "right", minWidth: 140 }}>
                <span className="badge amber">{(pair.similarity * 100).toFixed(0)}% similar</span>
                <div className="muted text-sm" style={{ marginTop: 4 }}>{pair.reason}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
