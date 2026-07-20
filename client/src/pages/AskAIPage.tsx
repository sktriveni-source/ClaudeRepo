import { useState } from "react";
import { api } from "../api/client";
import type { Domain, FieldMappingSuggestion, NlQueryResult } from "../types";

const EXAMPLES = [
  "Find suppliers with incomplete address information and duplicate tax IDs.",
  "Show customers with a low quality score",
  "Find products with an unusual price",
  "Show suppliers with missing email",
];

export default function AskAIPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<NlQueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [mappingDomain, setMappingDomain] = useState<Domain>("suppliers");
  const [rawFieldsText, setRawFieldsText] = useState("vendor_nm, tax_number, ph, addr1, zipcode, supplierclass");
  const [mapping, setMapping] = useState<FieldMappingSuggestion[] | null>(null);
  const [mappingLoading, setMappingLoading] = useState(false);

  async function runQuery(q: string) {
    setLoading(true);
    setQuery(q);
    const r = await api.nlQuery(q);
    setResult(r);
    setLoading(false);
  }

  async function runMapping() {
    setMappingLoading(true);
    const fields = rawFieldsText.split(",").map((f) => f.trim()).filter(Boolean);
    const r = await api.fieldMapping(mappingDomain, fields);
    setMapping(r.mapping);
    setMappingLoading(false);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Ask the Data</h1>
          <p className="page-subtitle">Natural-language querying: describe what you're looking for and it's translated into a structured query against the golden record store.</p>
        </div>
      </header>

      <div className="card form-card">
        <div className="form-row">
          <input
            className="grow"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "Find suppliers with incomplete address information and duplicate tax IDs."'
            onKeyDown={(e) => e.key === "Enter" && runQuery(query)}
          />
          <button className="btn-primary" onClick={() => runQuery(query)} disabled={loading || !query.trim()}>
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>
        <div className="tag-list">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="tag tag-button" onClick={() => runQuery(ex)}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="card">
          {!result.understood ? (
            <div className="banner banner-warn">{result.message}</div>
          ) : (
            <>
              <div className="card-title">Interpreted as</div>
              <code className="query-plan">{result.interpretedAs}</code>
              <div className="card-footnote">{result.matchCount} match{result.matchCount === 1 ? "" : "es"}</div>

              <table className="cluster-table" style={{ marginTop: 16 }}>
                <thead>
                  <tr>
                    <th>Record</th>
                    <th>Source</th>
                    <th>Why it matched</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results?.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="cell-primary">{(r.name as string) ?? (r.sku as string)}</div>
                        <div className="cell-secondary">{r.id}</div>
                      </td>
                      <td>{r.sourceName}</td>
                      <td className="cell-secondary">{r.matchReasons.join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      <div className="card form-card">
        <div className="card-title">Field mapping recommendations</div>
        <p className="card-subtitle">AI opportunity: when onboarding a new source, suggest how its raw columns map onto the canonical MDM schema.</p>
        <div className="form-row">
          <select value={mappingDomain} onChange={(e) => setMappingDomain(e.target.value as Domain)}>
            <option value="suppliers">Suppliers</option>
            <option value="customers">Customers</option>
            <option value="products">Products</option>
          </select>
          <input className="grow" value={rawFieldsText} onChange={(e) => setRawFieldsText(e.target.value)} placeholder="comma-separated raw column names" />
          <button className="btn-secondary" onClick={runMapping} disabled={mappingLoading}>
            {mappingLoading ? "Mapping…" : "Suggest mapping"}
          </button>
        </div>
        {mapping && (
          <table className="cluster-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Raw field</th>
                <th>Suggested canonical field</th>
                <th>Confidence</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {mapping.map((m) => (
                <tr key={m.rawField}>
                  <td className="cell-primary">{m.rawField}</td>
                  <td>{m.suggestedField ?? <em>unmapped</em>}</td>
                  <td>{Math.round(m.confidence * 100)}%</td>
                  <td className="cell-secondary">{m.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
