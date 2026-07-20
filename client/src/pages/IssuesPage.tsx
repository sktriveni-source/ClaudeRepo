import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Domain, Issue } from "../types";
import Badge from "../components/Badge";

const DOMAINS: Domain[] = ["suppliers", "customers", "products"];
const STATUSES = ["open", "in_review", "resolved", "rejected"];
const SEVERITIES = ["critical", "high", "medium", "low"];
const CATEGORIES = ["completeness", "validity", "anomaly"];

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [domain, setDomain] = useState<Domain | "">("");
  const [status, setStatus] = useState("open");
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [suggestion, setSuggestion] = useState<Record<string, { action: string; suggestion: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    api
      .issues({ domain: domain || undefined, status: status || undefined, severity: severity || undefined, category: category || undefined })
      .then(setIssues);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, status, severity, category]);

  async function handleShowSuggestion(issue: Issue) {
    if (suggestion[issue.id]) return;
    const s = await api.issueSuggestion(issue.id);
    setSuggestion((prev) => ({ ...prev, [issue.id]: s }));
  }

  async function handleRequestFix(issue: Issue) {
    setBusyId(issue.id);
    await api.requestFix(issue.id);
    await load();
    setBusyId(null);
  }

  async function handleDismiss(issue: Issue) {
    setBusyId(issue.id);
    await api.updateIssue(issue.id, { status: "rejected" });
    await load();
    setBusyId(null);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Issue Management</h1>
          <p className="page-subtitle">Every completeness, validity, and anomaly finding routed to one queue with AI-suggested fixes.</p>
        </div>
      </header>

      <div className="filter-row">
        <select value={domain} onChange={(e) => setDomain(e.target.value as Domain | "")}>
          <option value="">All domains</option>
          {DOMAINS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="card-footnote">{issues.length} issue{issues.length === 1 ? "" : "s"}</span>
      </div>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Severity</th>
              <th>Domain</th>
              <th>Category</th>
              <th>Description</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id}>
                <td><Badge tone={issue.severity}>{issue.severity}</Badge></td>
                <td className="capitalize">{issue.domain}</td>
                <td className="capitalize">{issue.category}</td>
                <td>
                  <div>{issue.description}</div>
                  {suggestion[issue.id] && <div className="issue-suggestion">💡 {suggestion[issue.id].suggestion}</div>}
                </td>
                <td><Badge tone={issue.status}>{issue.status.replace("_", " ")}</Badge></td>
                <td className="action-cell">
                  {issue.status === "open" && (
                    <>
                      <button className="btn-link" onClick={() => handleShowSuggestion(issue)}>Suggest fix</button>
                      <button className="btn-link" disabled={busyId === issue.id} onClick={() => handleRequestFix(issue)}>Request fix</button>
                      <button className="btn-link-danger" disabled={busyId === issue.id} onClick={() => handleDismiss(issue)}>Dismiss</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">No issues match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
