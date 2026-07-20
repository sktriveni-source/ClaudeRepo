import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Domain, ValidationRule } from "../types";
import Badge from "../components/Badge";

const DOMAINS: Domain[] = ["suppliers", "customers", "products"];

function describeRule(r: ValidationRule) {
  if (r.ruleType === "required") return `${r.field} is required`;
  if (r.ruleType === "regex") return `${r.field} must match ${r.pattern}`;
  if (r.ruleType === "range") return `${r.field} must be between ${r.min} and ${r.max}`;
  if (r.ruleType === "enum") return `${r.field} must be one of: ${r.values?.join(", ")}`;
  return r.field;
}

export default function RulesPage() {
  const [domain, setDomain] = useState<Domain>("suppliers");
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [nlText, setNlText] = useState("");
  const [nlPreview, setNlPreview] = useState<{ understood: boolean; rule?: Partial<ValidationRule>; message?: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  const load = () => api.rules(domain).then(setRules);

  useEffect(() => {
    setRunResult(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  async function handleNlPreview() {
    if (!nlText.trim()) return;
    const result = await api.ruleFromText(nlText.trim());
    setNlPreview(result);
  }

  async function handleSaveNlRule() {
    if (!nlPreview?.understood || !nlPreview.rule) return;
    await api.createRule(nlPreview.rule);
    setNlText("");
    setNlPreview(null);
    await load();
  }

  async function handleDelete(id: string) {
    await api.deleteRule(id);
    await load();
  }

  async function handleRun() {
    setRunning(true);
    const result = await api.runValidation(domain);
    setRunResult(`${result.issuesCreated} issue(s) found and added to the issue queue.`);
    setRunning(false);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Validation Rules</h1>
          <p className="page-subtitle">Required fields, format checks, ranges, and taxonomy enums applied during each validation run.</p>
        </div>
        <button className="btn-primary" onClick={handleRun} disabled={running}>
          {running ? "Running…" : `Run validation on ${domain}`}
        </button>
      </header>

      {runResult && <div className="banner banner-info">{runResult}</div>}

      <div className="tab-row">
        {DOMAINS.map((d) => (
          <button key={d} className={`tab ${domain === d ? "tab-active" : ""}`} onClick={() => setDomain(d)}>
            {d}
          </button>
        ))}
      </div>

      <div className="card form-card">
        <div className="card-title">Create a rule from plain English</div>
        <p className="card-subtitle">AI opportunity: natural-language rule creation. Try “Suppliers must have a valid tax ID” or “Product unit price must be between 1 and 300”.</p>
        <div className="form-row">
          <input
            className="grow"
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            placeholder="Describe the rule in plain English…"
            onKeyDown={(e) => e.key === "Enter" && handleNlPreview()}
          />
          <button className="btn-secondary" onClick={handleNlPreview}>Preview</button>
        </div>
        {nlPreview && (
          <div className={`nl-preview ${nlPreview.understood ? "" : "nl-preview-error"}`}>
            {nlPreview.understood ? (
              <>
                <div><strong>{nlPreview.rule?.domain}</strong> · {describeRule(nlPreview.rule as ValidationRule)}</div>
                <button className="btn-primary" onClick={handleSaveNlRule}>Save Rule</button>
              </>
            ) : (
              <div>{nlPreview.message}</div>
            )}
          </div>
        )}
      </div>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Rule</th>
              <th>Severity</th>
              <th>Source</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td className="cell-primary">{r.field}</td>
                <td>{describeRule(r)}</td>
                <td><Badge tone={r.severity}>{r.severity}</Badge></td>
                <td className="capitalize">{r.source}</td>
                <td>
                  <button className="btn-link-danger" onClick={() => handleDelete(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
