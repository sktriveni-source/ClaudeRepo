import TopBar from "../../components/TopBar";
import AiAssistantPanel from "../../components/AiAssistantPanel";
import { useApi } from "../../hooks/useApi";
import { plmApi } from "../../api/client";
import { LoadingState } from "../../components/StateMessages";
import { Link } from "react-router-dom";

export default function PlmAssistantPage() {
  const duplicates = useApi(() => plmApi.duplicates(), []);

  return (
    <>
      <TopBar title="AI Assistant" subtitle="PLM · AI-Assisted Product Information Retrieval" />
      <div className="content">
        <div className="section">
          <AiAssistantPanel
            title="Ask about products, documents, or lifecycle status"
            placeholder="e.g. Show products approaching end-of-life with unresolved change requests"
            suggestions={[
              "Show products approaching end-of-life with unresolved change requests",
              "Which products need compliance review?",
              "Summarize the HVC-900 drawing package",
            ]}
            onAsk={(q) => plmApi.aiQuery(q)}
          />
        </div>

        <div className="card section">
          <div className="card-header">
            <h3>✦ Duplicate Product Detection</h3>
          </div>
          {duplicates.loading && <LoadingState />}
          {duplicates.data && duplicates.data.candidates.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>No likely duplicate products detected.</p>
          )}
          {duplicates.data && duplicates.data.candidates.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product A</th>
                  <th>Product B</th>
                  <th>Similarity</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {duplicates.data.candidates.map((c: any, i: number) => (
                  <tr key={i}>
                    <td><Link to={`/plm/products/${c.productA.id}`}>{c.productA.name}</Link></td>
                    <td><Link to={`/plm/products/${c.productB.id}`}>{c.productB.name}</Link></td>
                    <td>{c.similarity}%</td>
                    <td>{c.reason}</td>
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
