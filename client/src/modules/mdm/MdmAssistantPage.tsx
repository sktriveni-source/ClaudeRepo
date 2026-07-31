import TopBar from "../../components/TopBar";
import AiAssistantPanel from "../../components/AiAssistantPanel";
import { useApi } from "../../hooks/useApi";
import { mdmApi } from "../../api/client";
import { LoadingState } from "../../components/StateMessages";

export default function MdmAssistantPage() {
  const duplicates = useApi(() => mdmApi.aiDuplicates(), []);

  return (
    <>
      <TopBar title="AI Assistant" subtitle="MDM · Natural-Language Rule Creation &amp; Search" />
      <div className="content">
        <div className="section">
          <AiAssistantPanel
            title="Ask a data-quality question"
            placeholder="e.g. Find suppliers with incomplete address information and duplicate tax IDs"
            suggestions={[
              "Find suppliers with incomplete address information and duplicate tax IDs",
              "Show customer records with duplicate entries",
              "Which product records have formatting issues?",
            ]}
            onAsk={(q) => mdmApi.aiQuery(q)}
          />
        </div>

        <div className="card section">
          <div className="card-header">
            <h3>✦ Intelligent Duplicate Detection</h3>
          </div>
          {duplicates.loading && <LoadingState />}
          {duplicates.data && duplicates.data.candidates.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>No likely duplicate records detected.</p>
          )}
          {duplicates.data && duplicates.data.candidates.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Record A</th>
                  <th>Record B</th>
                  <th>Confidence</th>
                  <th>Matched On</th>
                </tr>
              </thead>
              <tbody>
                {duplicates.data.candidates.map((c: any, i: number) => (
                  <tr key={i}>
                    <td>{c.recordA.attributes.name} <span style={{ color: "var(--text-faint)" }}>({c.recordA.id})</span></td>
                    <td>{c.recordB.attributes.name} <span style={{ color: "var(--text-faint)" }}>({c.recordB.id})</span></td>
                    <td>{c.confidence}%</td>
                    <td>{c.matchedOn.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
