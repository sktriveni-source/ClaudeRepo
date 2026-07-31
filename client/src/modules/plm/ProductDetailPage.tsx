import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import TopBar from "../../components/TopBar";
import Badge from "../../components/Badge";
import { useApi } from "../../hooks/useApi";
import { plmApi } from "../../api/client";
import { LoadingState, ErrorState } from "../../components/StateMessages";
import type { PlmDocument } from "../../types";

function DocumentCard({ doc, onSummarize }: { doc: PlmDocument; onSummarize: (id: string) => Promise<void> }) {
  const [summarizing, setSummarizing] = useState(false);

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-header">
        <h3 style={{ fontSize: 15 }}>{doc.title}</h3>
        <Badge>{doc.status}</Badge>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: -8 }}>
        {doc.type} · v{doc.version} · uploaded by {doc.uploadedBy}
      </p>
      {doc.summary ? (
        <div className="ai-insight-box">✦ AI Summary: {doc.summary}</div>
      ) : (
        <button
          className="btn"
          disabled={summarizing}
          onClick={async () => {
            setSummarizing(true);
            await onSummarize(doc.id);
            setSummarizing(false);
          }}
        >
          {summarizing ? "Summarizing…" : "✦ AI Summarize"}
        </button>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const product = useApi(() => plmApi.getProduct(id!), [id]);
  const documents = useApi(() => plmApi.listDocuments(id!), [id]);
  const changeRequests = useApi(() => plmApi.listChangeRequests({ productId: id! }), [id]);
  const recommendations = useApi(() => plmApi.qualityRecommendations(id!), [id]);
  const audit = useApi(() => plmApi.audit(id!), [id]);

  if (product.loading) return <div className="content"><LoadingState /></div>;
  if (product.error || !product.data) return <div className="content"><ErrorState message={product.error || "Not found"} /></div>;

  const p = product.data;

  async function handleSummarize(docId: string) {
    await plmApi.summarizeDocument(docId);
    documents.reload();
  }

  return (
    <>
      <TopBar title={p.name} subtitle={`PLM · Products · ${p.sku}`} />
      <div className="content">
        <div className="grid grid-2 section">
          <div className="card">
            <div className="card-header">
              <h3>Product Details</h3>
              <Badge>{p.lifecycleStage}</Badge>
            </div>
            <p>{p.description}</p>
            <table className="data-table">
              <tbody>
                <tr><td>SKU</td><td>{p.sku}</td></tr>
                <tr><td>Category</td><td>{p.category}</td></tr>
                <tr><td>Version</td><td>{p.version}</td></tr>
                <tr><td>Owner</td><td>{p.owner}</td></tr>
                <tr><td>Compliance</td><td><Badge>{p.complianceStatus}</Badge></td></tr>
                <tr><td>Tags</td><td>{p.tags.join(", ") || "—"}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>✦ AI Data-Quality Recommendations</h3>
            </div>
            {recommendations.loading && <LoadingState />}
            {recommendations.data && recommendations.data.recommendations.length === 0 && (
              <p style={{ color: "var(--text-muted)" }}>No recommendations — product data looks healthy.</p>
            )}
            {recommendations.data && recommendations.data.recommendations.length > 0 && (
              <ul style={{ paddingLeft: 18 }}>
                {recommendations.data.recommendations.map((r, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="section">
          <h3>Documents</h3>
          {documents.loading && <LoadingState />}
          {documents.data?.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onSummarize={handleSummarize} />
          ))}
        </div>

        <div className="card section">
          <div className="card-header">
            <h3>Change Requests</h3>
          </div>
          {changeRequests.loading && <LoadingState />}
          {changeRequests.data && changeRequests.data.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>No change requests for this product.</p>
          )}
          {changeRequests.data && changeRequests.data.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Requested By</th>
                </tr>
              </thead>
              <tbody>
                {changeRequests.data.map((cr) => (
                  <tr key={cr.id}>
                    <td>
                      <Link to="/plm/change-requests">{cr.title}</Link>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{cr.description}</div>
                    </td>
                    <td><Badge>{cr.priority}</Badge></td>
                    <td><Badge>{cr.status}</Badge></td>
                    <td>{cr.requestedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card section">
          <div className="card-header">
            <h3>Audit History</h3>
          </div>
          {audit.loading && <LoadingState />}
          {audit.data && audit.data.length === 0 && <p style={{ color: "var(--text-muted)" }}>No audit entries yet.</p>}
          {audit.data && audit.data.length > 0 && (
            <ul className="timeline">
              {audit.data.map((a) => (
                <li key={a.id}>
                  <div className="timeline-date">{new Date(a.changedDate).toLocaleString()}</div>
                  <div className="timeline-title">{a.action} by {a.changedBy}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
