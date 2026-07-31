import { useState } from "react";
import TopBar from "../../components/TopBar";
import Badge from "../../components/Badge";
import { useApi } from "../../hooks/useApi";
import { mdmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";

const STATUSES = ["Open", "In Review", "Resolved"];

export default function IssuesPage() {
  const { data, loading, error, reload } = useApi(() => mdmApi.listIssues(), []);
  const [statusFilter, setStatusFilter] = useState("");

  async function advance(id: string, current: string) {
    const idx = STATUSES.indexOf(current);
    const next = STATUSES[Math.min(idx + 1, STATUSES.length - 1)];
    await mdmApi.updateIssue(id, { status: next, changedBy: "Data Steward" });
    reload();
  }

  const filtered = data ? (statusFilter ? data.filter((i) => i.status === statusFilter) : data) : [];

  return (
    <>
      <TopBar title="Issue Management" subtitle="MDM · Data Quality Workflow" />
      <div className="content">
        <div className="filter-bar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}

        {filtered.length > 0 && (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      <strong>{issue.record?.attributes.name || issue.recordId}</strong>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{issue.description}</div>
                    </td>
                    <td><Badge tone="neutral">{issue.type}</Badge></td>
                    <td><Badge>{issue.severity}</Badge></td>
                    <td><Badge>{issue.status}</Badge></td>
                    <td>{issue.assignedTo || <em style={{ color: "var(--text-faint)" }}>Unassigned</em>}</td>
                    <td>
                      {issue.status !== "Resolved" && (
                        <button className="btn" onClick={() => advance(issue.id, issue.status)}>
                          Advance →
                        </button>
                      )}
                    </td>
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
