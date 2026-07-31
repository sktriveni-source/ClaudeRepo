import { Link } from "react-router-dom";
import TopBar from "../../components/TopBar";
import StatCard from "../../components/StatCard";
import Badge from "../../components/Badge";
import { useApi } from "../../hooks/useApi";
import { plmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

export default function PlmDashboardPage() {
  const { data, loading, error } = useApi(plmApi.dashboard, []);

  return (
    <>
      <TopBar title="PLM Dashboard" subtitle="Product Lifecycle Management" />
      <div className="content">
        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {data && (
          <>
            <div className="grid grid-4 section">
              <StatCard label="Total Products" value={data.totalProducts} />
              <StatCard label="Documents" value={data.totalDocuments} />
              <StatCard label="Open Change Requests" value={data.openChangeRequests} />
              <StatCard label="Compliance Flags" value={data.complianceReviewNeeded} />
            </div>

            <div className="grid grid-2 section">
              <div className="card">
                <div className="card-header">
                  <h3>Lifecycle Breakdown</h3>
                </div>
                {Object.entries(data.lifecycleBreakdown).map(([stage, count]) => (
                  <div key={stage} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span>{stage}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${(count / data.totalProducts) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Products Approaching End-of-Life with Open Change Requests</h3>
                </div>
                {data.productsNeedingAttention.length === 0 ? (
                  <p style={{ color: "var(--text-muted)" }}>None currently — good news.</p>
                ) : (
                  <ul style={{ paddingLeft: 18 }}>
                    {data.productsNeedingAttention.map((p) => (
                      <li key={p.id} style={{ marginBottom: 8 }}>
                        <Link to={`/plm/products/${p.id}`}>{p.name}</Link> <Badge>{p.lifecycleStage}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
