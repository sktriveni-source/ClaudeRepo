import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Domain, DomainProfile } from "../types";

const DOMAINS: Domain[] = ["suppliers", "customers", "products"];

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function barClass(v: number) {
  if (v >= 0.85) return "bar-good";
  if (v >= 0.6) return "bar-warn";
  return "bar-bad";
}

export default function ProfilingPage() {
  const [domain, setDomain] = useState<Domain>("suppliers");
  const [profile, setProfile] = useState<DomainProfile | null>(null);

  useEffect(() => {
    setProfile(null);
    api.profile(domain).then(setProfile);
  }, [domain]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Data Profiling</h1>
          <p className="page-subtitle">Field-level completeness, uniqueness, and format-consistency analysis across all connected sources.</p>
        </div>
      </header>

      <div className="tab-row">
        {DOMAINS.map((d) => (
          <button key={d} className={`tab ${domain === d ? "tab-active" : ""}`} onClick={() => setDomain(d)}>
            {d}
          </button>
        ))}
      </div>

      {!profile ? (
        <p>Profiling {domain}…</p>
      ) : (
        <>
          <section className="card-grid">
            <div className="card">
              <div className="card-title">Records Profiled</div>
              <div className="big-number">{profile.recordCount}</div>
              <div className="card-footnote">Across {profile.sources.length} source{profile.sources.length === 1 ? "" : "s"}</div>
            </div>
            <div className="card">
              <div className="card-title">Avg. Completeness</div>
              <div className="big-number">{pct(profile.summary.avgCompleteness)}</div>
            </div>
            <div className="card">
              <div className="card-title">Avg. Format Consistency</div>
              <div className="big-number">{pct(profile.summary.avgFormatConsistency)}</div>
            </div>
            <div className="card">
              <div className="card-title">Weakest Fields</div>
              <div className="tag-list">
                {profile.summary.weakestFields.map((f) => (
                  <span className="tag" key={f}>{f}</span>
                ))}
              </div>
            </div>
          </section>

          <div className="card table-card">
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Completeness</th>
                  <th>Uniqueness</th>
                  <th>Format Consistency</th>
                  <th>Pattern Variants</th>
                  <th>Sample Values</th>
                </tr>
              </thead>
              <tbody>
                {profile.fields.map((f) => (
                  <tr key={f.field}>
                    <td className="cell-primary">{f.field}</td>
                    <td>{f.type}</td>
                    <td>
                      <div className="bar-track small">
                        <div className={`bar-fill ${barClass(f.completeness)}`} style={{ width: pct(f.completeness) }} />
                      </div>
                      <span className="bar-caption">{pct(f.completeness)}</span>
                    </td>
                    <td>{pct(f.uniqueness)}</td>
                    <td>
                      <div className="bar-track small">
                        <div className={`bar-fill ${barClass(f.formatConsistency)}`} style={{ width: pct(f.formatConsistency) }} />
                      </div>
                      <span className="bar-caption">{pct(f.formatConsistency)}</span>
                    </td>
                    <td>{f.patternVariants > 1 ? <span className="warn-text">{f.patternVariants} variants</span> : "1"}</td>
                    <td className="cell-secondary">{f.sampleValues.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
