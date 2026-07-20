import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { LifecycleBadge, ComplianceBadge, CRStatusBadge, PriorityBadge } from "../components/StatusBadge";
import type {
  AuditEntry,
  ChangeRequest,
  ComplianceStatus,
  DocumentSummary,
  LifecycleStage,
  Product,
  ProductDocument,
} from "../types";

const STAGES: LifecycleStage[] = ["concept", "design", "active", "phase_out", "end_of_life", "obsolete"];
const COMPLIANCE: ComplianceStatus[] = ["compliant", "pending_review", "non_compliant", "not_applicable"];
const CR_STATUSES = ["draft", "submitted", "in_review", "approved", "rejected", "implemented"] as const;
const TABS = ["Overview", "Documents", "Change Requests", "Audit History"] as const;

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    api.getProduct(id).then(setProduct).catch((e) => setError(e.message));
    api.productDocuments(id).then(setDocuments);
    api.productChangeRequests(id).then(setChangeRequests);
    if (can("audit:read")) api.productAudit(id).then(setAudit);
  }, [id, can]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <div className="empty-state">{error}</div>;
  if (!product) return <div className="empty-state">Loading product...</div>;

  return (
    <div>
      <div className="muted text-sm" style={{ marginBottom: 4 }}>
        <Link to="/products">&larr; Back to products</Link>
      </div>
      <h2 style={{ margin: "4px 0 2px" }}>{product.name}</h2>
      <div className="muted text-sm" style={{ marginBottom: 16 }}>
        {product.code} &middot; {product.category} &middot; Revision {product.revision}
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </div>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab product={product} onUpdated={load} />}
      {tab === "Documents" && <DocumentsTab productId={product.id} documents={documents} onChanged={load} />}
      {tab === "Change Requests" && (
        <ChangeRequestsTab productId={product.id} changeRequests={changeRequests} onChanged={load} />
      )}
      {tab === "Audit History" &&
        (can("audit:read") ? (
          <AuditTab entries={audit} />
        ) : (
          <div className="card empty-state">Your role does not have access to audit history.</div>
        ))}
    </div>
  );
}

function OverviewTab({ product, onUpdated }: { product: Product; onUpdated: () => void }) {
  const { can, user } = useAuth();
  const editable = can("products:write");
  const [saving, setSaving] = useState(false);

  async function patch(field: keyof Product, value: string) {
    setSaving(true);
    try {
      await api.updateProduct(product.id, { [field]: value });
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-title">Product details</div>
        <div className="field">
          <label>Description</label>
          {editable ? (
            <textarea
              rows={3}
              defaultValue={product.description}
              onBlur={(e) => e.target.value !== product.description && patch("description", e.target.value)}
            />
          ) : (
            <p>{product.description || <span className="muted">No description on file.</span>}</p>
          )}
        </div>
        <div className="field">
          <label>Owner</label>
          {editable ? (
            <input
              defaultValue={product.owner}
              onBlur={(e) => e.target.value !== product.owner && patch("owner", e.target.value)}
            />
          ) : (
            <p>{product.owner || <span className="muted">Unassigned</span>}</p>
          )}
        </div>
        <div className="field">
          <label>Lifecycle stage</label>
          {editable ? (
            <select
              value={product.lifecycleStage}
              disabled={saving}
              onChange={(e) => patch("lifecycleStage", e.target.value)}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          ) : (
            <LifecycleBadge stage={product.lifecycleStage} />
          )}
        </div>
        <div className="field">
          <label>Compliance status</label>
          {editable && can("changeRequests:approve") ? (
            <select
              value={product.complianceStatus}
              disabled={saving}
              onChange={(e) => patch("complianceStatus", e.target.value)}
            >
              {COMPLIANCE.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
          ) : (
            <ComplianceBadge status={product.complianceStatus} />
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Attributes</div>
        {Object.keys(product.attributes).length === 0 ? (
          <div className="muted text-sm">No structured attributes recorded.</div>
        ) : (
          <table>
            <tbody>
              {Object.entries(product.attributes).map(([k, v]) => (
                <tr key={k}>
                  <td className="muted">{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="card-title" style={{ marginTop: 18 }}>Metadata</div>
        <table>
          <tbody>
            <tr><td className="muted">Tags</td><td>{product.tags.join(", ") || "—"}</td></tr>
            <tr><td className="muted">EOL date</td><td>{product.eolDate || "—"}</td></tr>
            <tr><td className="muted">Created</td><td>{new Date(product.createdAt).toLocaleDateString()}</td></tr>
            <tr><td className="muted">Updated</td><td>{new Date(product.updatedAt).toLocaleDateString()}</td></tr>
          </tbody>
        </table>
        {!editable && (
          <div className="muted text-sm" style={{ marginTop: 14 }}>
            Signed in as {user?.roleLabel} &mdash; read-only access to product fields.
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentsTab({
  productId,
  documents,
  onChanged,
}: {
  productId: string;
  documents: ProductDocument[];
  onChanged: () => void;
}) {
  const { can } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, DocumentSummary>>({});
  const [metadata, setMetadata] = useState<Record<string, Record<string, string>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  async function summarize(docId: string) {
    setBusy(docId + ":summary");
    try {
      const result = await api.summarizeDocument(docId);
      setSummaries((s) => ({ ...s, [docId]: result }));
    } finally {
      setBusy(null);
    }
  }

  async function extract(docId: string) {
    setBusy(docId + ":metadata");
    try {
      const result = await api.extractMetadata(docId);
      setMetadata((m) => ({ ...m, [docId]: result.metadata }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="toolbar">
        <div className="spacer" />
        {can("documents:write") && (
          <button className="btn primary" onClick={() => setShowUpload((v) => !v)}>
            {showUpload ? "Cancel" : "+ Upload document"}
          </button>
        )}
      </div>

      {showUpload && (
        <UploadDocumentForm
          productId={productId}
          onDone={() => {
            setShowUpload(false);
            onChanged();
          }}
        />
      )}

      {documents.length === 0 ? (
        <div className="card empty-state">No documents attached to this product yet.</div>
      ) : (
        documents.map((doc) => (
          <div key={doc.id} className="card section">
            <div className="toolbar" style={{ marginBottom: expanded === doc.id ? 12 : 0 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{doc.name}</div>
                <div className="muted text-sm">
                  {doc.type} &middot; v{doc.version} &middot; uploaded by {doc.uploadedBy} on{" "}
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="spacer" />
              <button className="btn" onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}>
                {expanded === doc.id ? "Collapse" : "View"}
              </button>
            </div>

            {expanded === doc.id && (
              <div>
                <p className="text-sm">{doc.content}</p>
                <div className="toolbar">
                  <button className="btn" disabled={busy === doc.id + ":summary"} onClick={() => summarize(doc.id)}>
                    {busy === doc.id + ":summary" ? "Summarizing..." : "Summarize with AI"}
                  </button>
                  <button className="btn" disabled={busy === doc.id + ":metadata"} onClick={() => extract(doc.id)}>
                    {busy === doc.id + ":metadata" ? "Extracting..." : "Extract metadata with AI"}
                  </button>
                </div>
                {summaries[doc.id] && (
                  <div className="result-card">
                    <div className="title">AI Summary</div>
                    <p className="text-sm">{summaries[doc.id].summary}</p>
                  </div>
                )}
                {metadata[doc.id] && (
                  <div className="result-card">
                    <div className="title">Extracted metadata</div>
                    <table>
                      <tbody>
                        {Object.entries(metadata[doc.id]).map(([k, v]) => (
                          <tr key={k}>
                            <td className="muted">{k}</td>
                            <td>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {Object.keys(metadata[doc.id]).length === 0 && (
                      <div className="muted text-sm">No recognizable metadata fields found.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function UploadDocumentForm({ productId, onDone }: { productId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Specification");
  const [version, setVersion] = useState("1.0");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await api.createDocument({ productId, name, type, version, content });
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card section">
      <div className="card-title">Upload document</div>
      <div className="field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Product Specification" />
      </div>
      <div className="field">
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {["Specification", "Drawing", "Compliance Certificate", "User Manual", "Test Report"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Version</label>
        <input value={version} onChange={(e) => setVersion(e.target.value)} />
      </div>
      <div className="field">
        <label>Content</label>
        <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste document text..." />
      </div>
      <button className="btn primary" disabled={!name || !content || saving} onClick={submit}>
        {saving ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}

function ChangeRequestsTab({
  productId,
  changeRequests,
  onChanged,
}: {
  productId: string;
  changeRequests: ChangeRequest[];
  onChanged: () => void;
}) {
  const { can } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(cr: ChangeRequest, status: string) {
    setError(null);
    try {
      await api.updateChangeRequest(cr.id, { status: status as ChangeRequest["status"] });
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update change request");
    }
  }

  return (
    <div>
      <div className="toolbar">
        <div className="spacer" />
        {can("changeRequests:write") && (
          <button className="btn primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ New change request"}
          </button>
        )}
      </div>

      {error && <div className="badge red" style={{ marginBottom: 12 }}>{error}</div>}

      {showForm && (
        <NewChangeRequestForm
          productId={productId}
          onDone={() => {
            setShowForm(false);
            onChanged();
          }}
        />
      )}

      {changeRequests.length === 0 ? (
        <div className="card empty-state">No change requests filed against this product.</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Requested by</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {changeRequests.map((cr) => (
                <tr key={cr.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{cr.title}</div>
                    <div className="muted text-sm">{cr.description}</div>
                  </td>
                  <td><PriorityBadge priority={cr.priority} /></td>
                  <td>
                    {can("changeRequests:write") ? (
                      <select value={cr.status} onChange={(e) => updateStatus(cr, e.target.value)}>
                        {CR_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    ) : (
                      <CRStatusBadge status={cr.status} />
                    )}
                  </td>
                  <td>{cr.requestedBy}</td>
                  <td>{new Date(cr.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewChangeRequestForm({ productId, onDone }: { productId: string; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await api.createChangeRequest({ productId, title, description, priority: priority as ChangeRequest["priority"] });
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card section">
      <div className="card-title">New change request</div>
      <div className="field">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label>Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {["low", "medium", "high", "critical"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <button className="btn primary" disabled={!title || saving} onClick={submit}>
        {saving ? "Submitting..." : "Submit request"}
      </button>
    </div>
  );
}

function AuditTab({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) return <div className="card empty-state">No audit history recorded yet.</div>;
  return (
    <div className="card">
      {entries.map((entry) => (
        <div key={entry.id} className="issue-row">
          <div style={{ minWidth: 140 }} className="muted text-sm">
            {new Date(entry.timestamp).toLocaleString()}
          </div>
          <div>
            <span className="badge neutral">{entry.action.replace("_", " ")}</span>{" "}
            <span className="text-sm">{entry.details}</span>
            <div className="muted text-sm">by {entry.user}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
