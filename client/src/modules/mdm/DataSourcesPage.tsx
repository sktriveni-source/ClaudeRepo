import TopBar from "../../components/TopBar";
import Badge from "../../components/Badge";
import { useApi } from "../../hooks/useApi";
import { mdmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

export default function DataSourcesPage() {
  const { data, loading, error } = useApi(mdmApi.listSources, []);

  return (
    <>
      <TopBar title="Data Sources" subtitle="MDM · Connected Systems" />
      <div className="content">
        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {data && (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Records</th>
                  <th>Last Profiled</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.type}</td>
                    <td><Badge>{s.connectionStatus}</Badge></td>
                    <td>{s.recordCount}</td>
                    <td>{new Date(s.lastProfiled).toLocaleDateString()}</td>
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
