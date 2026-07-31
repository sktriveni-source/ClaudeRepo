import TopBar from "../../components/TopBar";
import StatCard from "../../components/StatCard";
import { useApi } from "../../hooks/useApi";
import { mdmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

export default function MdmDashboardPage() {
  const { data, loading, error } = useApi(mdmApi.dashboard, []);

  return (
    <>
      <TopBar title="Data Quality Dashboard" subtitle="Master Data Management" />
      <div className="content">
        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {data && (
          <>
            <div className="grid grid-4 section">
              <StatCard label="Data Sources" value={data.totalSources} />
              <StatCard label="Master Records" value={data.totalRecords} />
              <StatCard label="Average Quality Score" value={`${data.averageQualityScore}%`} />
              <StatCard label="Open Issues" value={data.openIssues} />
            </div>

            <div className="grid grid-2 section">
              <div className="card">
                <div className="card-header">
                  <h3>Records by Entity Type</h3>
                </div>
                {Object.entries(data.recordsByEntityType).map(([type, count]) => (
                  <div key={type} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span>{type}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${(count / data.totalRecords) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Issue Breakdown</h3>
                </div>
                {Object.entries(data.issueBreakdown).map(([type, count]) => (
                  <div key={type} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span>{type}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
