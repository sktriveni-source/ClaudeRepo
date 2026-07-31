import TopBar from "../../components/TopBar";
import { useApi } from "../../hooks/useApi";
import { crmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

export default function PipelinePage() {
  const { data, loading, error } = useApi(crmApi.pipeline, []);

  return (
    <>
      <TopBar title="Sales Pipeline" subtitle="CRM · Pipeline Visualization" />
      <div className="content">
        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {data && (
          <div className="card">
            {(() => {
              const max = Math.max(...data.stages.map((s) => s.value), 1);
              return data.stages.map((s) => (
                <div key={s.stage} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <strong>{s.stage}</strong>
                    <span>
                      ${s.value.toLocaleString()} <span style={{ color: "var(--text-muted)" }}>({s.count})</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: 28,
                      width: `${Math.max((s.value / max) * 100, s.value > 0 ? 4 : 0)}%`,
                      minWidth: s.value > 0 ? 60 : 0,
                      borderRadius: 6,
                      background: "linear-gradient(90deg, #4338ca, #0891b2)",
                      display: "flex",
                      alignItems: "center",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      paddingLeft: 10,
                    }}
                  >
                    {s.value > 0 ? `$${(s.value / 1000).toFixed(0)}K` : ""}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </>
  );
}
