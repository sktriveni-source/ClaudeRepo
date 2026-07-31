import TopBar from "../../components/TopBar";
import StatCard from "../../components/StatCard";
import { useApi } from "../../hooks/useApi";
import { crmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

const fmt = (n: number) => `$${(n / 1_000_000).toFixed(2)}M`;

export default function CrmDashboardPage() {
  const { data, loading, error } = useApi(crmApi.dashboard, []);
  const pipeline = useApi(crmApi.pipeline, []);

  return (
    <>
      <TopBar title="Sales Dashboard" subtitle="CRM · Customer Intelligence Platform" />
      <div className="content">
        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {data && (
          <>
            <div className="grid grid-4 section">
              <StatCard label="Sales Target" value={fmt(data.salesTarget)} hint="This quarter" />
              <StatCard label="Total Pipeline" value={fmt(data.totalPipeline)} />
              <StatCard label="Weighted Pipeline" value={fmt(data.weightedPipeline)} />
              <StatCard label="Closed Won" value={fmt(data.closedWon)} />
            </div>

            <div className="grid grid-2 section">
              <div className="card">
                <StatCard label="Accounts" value={data.totalAccounts} />
              </div>
              <div className="card">
                <StatCard label="Active Leads" value={data.totalLeads} />
              </div>
            </div>

            <div className="card section">
              <div className="card-header">
                <h3>Pipeline by Stage</h3>
              </div>
              {pipeline.loading && <LoadingState />}
              {pipeline.data && (
                <div>
                  {pipeline.data.stages
                    .filter((s) => s.count > 0)
                    .map((s) => {
                      const max = Math.max(...pipeline.data!.stages.map((x) => x.value), 1);
                      return (
                        <div key={s.stage} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                            <span>{s.stage} ({s.count})</span>
                            <strong>${s.value.toLocaleString()}</strong>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${(s.value / max) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
