import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Domain, DuplicateCluster } from "../types";
import Badge from "../components/Badge";

const DOMAINS: Domain[] = ["suppliers", "customers", "products"];

export default function DuplicatesPage() {
  const [domain, setDomain] = useState<Domain>("suppliers");
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);

  const load = () => api.duplicates(domain).then(setClusters);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  async function handleRescan() {
    setRescanning(true);
    await api.runDuplicateScan(domain);
    await load();
    setRescanning(false);
  }

  async function handleResolve(clusterId: string, action: "merge" | "reject") {
    setBusy(clusterId);
    await api.resolveCluster(domain, clusterId, action);
    await load();
    setBusy(null);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Duplicate Detection</h1>
          <p className="page-subtitle">AI opportunity: weighted field-similarity matching (name, tax ID, address, email) explains every match instead of a black-box score.</p>
        </div>
        <button className="btn-primary" onClick={handleRescan} disabled={rescanning}>
          {rescanning ? "Scanning…" : "Rescan for duplicates"}
        </button>
      </header>

      <div className="tab-row">
        {DOMAINS.map((d) => (
          <button key={d} className={`tab ${domain === d ? "tab-active" : ""}`} onClick={() => setDomain(d)}>
            {d}
          </button>
        ))}
      </div>

      {clusters.length === 0 && <p className="card-subtitle">No duplicate clusters found in {domain}.</p>}

      <div className="cluster-list">
        {clusters.map((c) => (
          <div className="card cluster-card" key={c.id}>
            <div className="cluster-header">
              <div>
                <Badge tone={c.confidence >= 0.9 ? "critical" : c.confidence >= 0.8 ? "high" : "medium"}>{Math.round(c.confidence * 100)}% match</Badge>
                <Badge tone={c.status === "open" ? "open" : c.status}>{c.status.replace("_", " ")}</Badge>
              </div>
              <div className="cluster-explanation">{c.explanation}</div>
            </div>

            <table className="cluster-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Source</th>
                  <th>Key fields</th>
                  <th>Completeness</th>
                </tr>
              </thead>
              <tbody>
                {c.members.map((m) => (
                  <tr key={m.id} className={m.id === c.suggestedGoldenRecordId ? "row-golden" : ""}>
                    <td>
                      <div className="cell-primary">{(m.name as string) ?? (m.sku as string)}</div>
                      <div className="cell-secondary">{m.id === c.suggestedGoldenRecordId ? "★ suggested golden record" : m.sourceRecordId}</div>
                    </td>
                    <td>{m.sourceName}</td>
                    <td className="cell-secondary">
                      {c.matchedFields.map((f) => `${f}: ${String((m as Record<string, unknown>)[f] ?? "—")}`).join(" · ")}
                    </td>
                    <td>{Math.round(m.completeness * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {c.status === "open" && (
              <div className="cluster-actions">
                <button className="btn-primary" disabled={busy === c.id} onClick={() => handleResolve(c.id, "merge")}>
                  Request merge into golden record
                </button>
                <button className="btn-secondary" disabled={busy === c.id} onClick={() => handleResolve(c.id, "reject")}>
                  Not a duplicate
                </button>
              </div>
            )}
            {c.status === "pending_approval" && <div className="card-footnote">Awaiting steward approval — see Approvals.</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
