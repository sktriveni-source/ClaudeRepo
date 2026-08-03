import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import CommentThread from "../components/CommentThread";
import ComponentForm, { type ComponentFormValues } from "../components/ComponentForm";
import ConfirmDialog from "../components/ConfirmDialog";
import CustomerForm, { type CustomerFormValues } from "../components/CustomerForm";
import LifecycleTracker from "../components/LifecycleTracker";
import ProductForm, { type ProductFormValues } from "../components/ProductForm";
import StageBadge from "../components/StageBadge";
import StageChangeForm from "../components/StageChangeForm";
import SupplierForm, { type SupplierFormValues } from "../components/SupplierForm";
import { useUser } from "../context/UserContext";
import type { AuditEntry, Component, Customer, Product, Stage, StageRequest, Supplier } from "../types";

type Tab = "overview" | "components" | "customers" | "suppliers" | "discussion" | "workflow";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { actorLabel } = useUser();

  const [product, setProduct] = useState<Product | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [requests, setRequests] = useState<StageRequest[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showStageChange, setShowStageChange] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [editComponent, setEditComponent] = useState<Component | null>(null);
  const [deleteComponent, setDeleteComponent] = useState<Component | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [p, stageList, reqs, auditLog] = await Promise.all([
        api.getProduct(id),
        api.getStages(),
        api.getProductRequests(id),
        api.getProductAudit(id),
      ]);
      setProduct(p);
      setStages(stageList);
      setRequests(reqs);
      setAudit(auditLog);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="state-message">Loading product…</div>;
  if (error || !product) return <div className="state-message error">{error || "Product not found."}</div>;

  const pending = requests.find((r) => r.status === "PENDING") || null;
  const bomCost = product.components.reduce((sum, c) => sum + c.quantity * c.unitCost, 0);

  async function handleEdit(values: ProductFormValues) {
    const updated = await api.updateProduct(product!.id, values, actorLabel);
    setProduct(updated);
    setShowEdit(false);
  }

  async function handleDelete() {
    await api.deleteProduct(product!.id, actorLabel);
    navigate("/products");
  }

  async function handleStageChange(toStage: string, comment: string) {
    await api.requestStageChange(product!.id, toStage, actorLabel, comment);
    setShowStageChange(false);
    await load();
  }

  async function withActionErrors(fn: () => Promise<void>) {
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="page">
      <button className="btn btn-link" onClick={() => navigate("/products")}>
        ← Back to products
      </button>

      <div className="page-header">
        <div>
          <div className="detail-title-row">
            <h1>{product.name}</h1>
            <StageBadge stage={product.lifecycleStage} />
            <span className="revision-badge">Rev {product.revision}</span>
          </div>
          <p className="page-subtitle">
            SKU {product.sku} · {product.category} · Owner {product.owner}
          </p>
        </div>
        <div className="button-row">
          <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>
            Edit
          </button>
          <button className="btn btn-danger-ghost" onClick={() => setShowDelete(true)}>
            Delete
          </button>
          <button
            className="btn btn-primary"
            disabled={!!pending || product.lifecycleStage === "DECLINE"}
            onClick={() => setShowStageChange(true)}
            title={pending ? "A stage-change request is already pending" : undefined}
          >
            Request stage change
          </button>
        </div>
      </div>

      {actionError && <div className="form-error">{actionError}</div>}

      <div className="panel">
        <LifecycleTracker stages={stages} current={product.lifecycleStage} pendingTarget={pending?.toStage} />
        {pending && (
          <div className="pending-banner">
            Pending request: move from <strong>{pending.fromStage}</strong> to{" "}
            <strong>{pending.toStage}</strong>, requested by {pending.requestedBy}
            {pending.requestComment ? ` — "${pending.requestComment}"` : ""}. Awaiting approval.
          </div>
        )}
      </div>

      <div className="tab-bar">
        <button className={tab === "overview" ? "tab active" : "tab"} onClick={() => setTab("overview")}>
          Overview
        </button>
        <button className={tab === "components" ? "tab active" : "tab"} onClick={() => setTab("components")}>
          Components ({product.components.length})
        </button>
        <button className={tab === "customers" ? "tab active" : "tab"} onClick={() => setTab("customers")}>
          Customers ({product.customers.length})
        </button>
        <button className={tab === "suppliers" ? "tab active" : "tab"} onClick={() => setTab("suppliers")}>
          Suppliers ({product.suppliers.length})
        </button>
        <button className={tab === "discussion" ? "tab active" : "tab"} onClick={() => setTab("discussion")}>
          Discussion ({product.comments.length})
        </button>
        <button className={tab === "workflow" ? "tab active" : "tab"} onClick={() => setTab("workflow")}>
          Workflow &amp; audit
        </button>
      </div>

      {tab === "overview" && (
        <div className="panel">
          <p>{product.description || "No description provided."}</p>
          <dl className="detail-grid">
            <div>
              <dt>Price</dt>
              <dd>${product.price.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Cost</dt>
              <dd>${product.cost.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Margin</dt>
              <dd>
                {product.price > 0
                  ? `${(((product.price - product.cost) / product.price) * 100).toFixed(1)}%`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>BOM rollup cost</dt>
              <dd>${bomCost.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{product.revision}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(product.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{new Date(product.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      )}

      {tab === "components" && (
        <div className="panel">
          <div className="panel-header">
            <h3>Bill of materials</h3>
            <button className="btn btn-secondary" onClick={() => setShowAddComponent(true)}>
              + Add component
            </button>
          </div>
          {product.components.length === 0 ? (
            <p className="hint-text">No components recorded for this product's BOM yet.</p>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Part number</th>
                    <th>Component</th>
                    <th>Qty / unit</th>
                    <th>Unit cost</th>
                    <th>Extended cost</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {product.components.map((c) => (
                    <tr key={c.id}>
                      <td>{c.partNumber || "—"}</td>
                      <td>{c.name}</td>
                      <td>{c.quantity}</td>
                      <td>${c.unitCost.toFixed(2)}</td>
                      <td>${(c.quantity * c.unitCost).toFixed(2)}</td>
                      <td className="table-actions">
                        <button className="btn btn-link" onClick={() => setEditComponent(c)}>
                          Edit
                        </button>
                        <button className="btn btn-link danger" onClick={() => setDeleteComponent(c)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="bom-rollup">
                BOM rollup cost: <strong>${bomCost.toFixed(2)}</strong> per unit
              </p>
            </>
          )}
        </div>
      )}

      {tab === "customers" && (
        <div className="panel">
          <div className="panel-header">
            <h3>Customers</h3>
            <button className="btn btn-secondary" onClick={() => setShowAddCustomer(true)}>
              + Add customer
            </button>
          </div>
          {product.customers.length === 0 ? (
            <p className="hint-text">No customers linked to this product yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Region</th>
                  <th>Since</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {product.customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.company}</td>
                    <td>{c.email}</td>
                    <td>{c.region}</td>
                    <td>{c.since}</td>
                    <td className="table-actions">
                      <button className="btn btn-link" onClick={() => setEditCustomer(c)}>
                        Edit
                      </button>
                      <button className="btn btn-link danger" onClick={() => setDeleteCustomer(c)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "suppliers" && (
        <div className="panel">
          <div className="panel-header">
            <h3>Suppliers</h3>
            <button className="btn btn-secondary" onClick={() => setShowAddSupplier(true)}>
              + Add supplier
            </button>
          </div>
          {product.suppliers.length === 0 ? (
            <p className="hint-text">No suppliers linked to this product yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Material / Component</th>
                  <th>Lead time</th>
                  <th>Country</th>
                  <th>Email</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {product.suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.material}</td>
                    <td>{s.leadTimeDays} days</td>
                    <td>{s.country}</td>
                    <td>{s.email}</td>
                    <td className="table-actions">
                      <button className="btn btn-link" onClick={() => setEditSupplier(s)}>
                        Edit
                      </button>
                      <button className="btn btn-link danger" onClick={() => setDeleteSupplier(s)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "discussion" && (
        <div className="panel">
          <h3>Discussion</h3>
          <CommentThread
            comments={product.comments}
            currentActor={actorLabel}
            onPost={(text) =>
              withActionErrors(async () => {
                const c = await api.addComment(product.id, text, actorLabel);
                setProduct((p) => (p ? { ...p, comments: [...p.comments, c] } : p));
              })
            }
            onDelete={(commentId) =>
              withActionErrors(async () => {
                await api.deleteComment(product.id, commentId, actorLabel);
                setProduct((p) =>
                  p ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p
                );
              })
            }
          />
        </div>
      )}

      {tab === "workflow" && (
        <div className="panel">
          <h3>Stage-change requests</h3>
          {requests.length === 0 ? (
            <p className="hint-text">No stage-change requests yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Requested by</th>
                  <th>Decided by</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fromStage}</td>
                    <td>{r.toStage}</td>
                    <td>
                      <span className={`status-pill status-${r.status.toLowerCase()}`}>{r.status}</span>
                    </td>
                    <td>{r.requestedBy}</td>
                    <td>{r.decidedBy || "—"}</td>
                    <td>{r.decisionComment || r.requestComment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 className="section-spacer">Revision history</h3>
          {product.revisionHistory.length === 0 ? (
            <p className="hint-text">No revisions recorded yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Revision</th>
                  <th>Stage</th>
                  <th>Released by</th>
                  <th>Date</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {[...product.revisionHistory].reverse().map((rev) => (
                  <tr key={rev.id}>
                    <td>Rev {rev.revision}</td>
                    <td>{rev.stage}</td>
                    <td>{rev.decidedBy}</td>
                    <td>{new Date(rev.decidedAt).toLocaleString()}</td>
                    <td>{rev.comment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 className="section-spacer">Audit log</h3>
          {audit.length === 0 ? (
            <p className="hint-text">No activity recorded yet.</p>
          ) : (
            <ul className="audit-list">
              {audit.map((a) => (
                <li key={a.id}>
                  <span className="audit-time">{new Date(a.timestamp).toLocaleString()}</span>
                  <span className="audit-actor">{a.actor}</span>
                  <span className="audit-action">{a.action.replace(/_/g, " ").toLowerCase()}</span>
                  <span className="audit-details">{a.details}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showEdit && (
        <ProductForm
          title="Edit product"
          submitLabel="Save changes"
          initial={product}
          onSubmit={handleEdit}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showDelete && (
        <ConfirmDialog
          title="Delete product"
          message={`Delete "${product.name}"? This removes its customers, suppliers, and workflow history.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {showStageChange && (
        <StageChangeForm
          stages={stages}
          current={product.lifecycleStage}
          onSubmit={handleStageChange}
          onClose={() => setShowStageChange(false)}
        />
      )}

      {showAddCustomer && (
        <CustomerForm
          onSubmit={async (values: CustomerFormValues) =>
            withActionErrors(async () => {
              const c = await api.addCustomer(product.id, values, actorLabel);
              setProduct((p) => (p ? { ...p, customers: [...p.customers, c] } : p));
              setShowAddCustomer(false);
            })
          }
          onClose={() => setShowAddCustomer(false)}
        />
      )}

      {editCustomer && (
        <CustomerForm
          initial={editCustomer}
          onSubmit={async (values: CustomerFormValues) =>
            withActionErrors(async () => {
              const c = await api.updateCustomer(product.id, editCustomer.id, values, actorLabel);
              setProduct((p) =>
                p ? { ...p, customers: p.customers.map((x) => (x.id === c.id ? c : x)) } : p
              );
              setEditCustomer(null);
            })
          }
          onClose={() => setEditCustomer(null)}
        />
      )}

      {deleteCustomer && (
        <ConfirmDialog
          title="Remove customer"
          message={`Remove "${deleteCustomer.name}" from this product's customer list?`}
          confirmLabel="Remove"
          danger
          onConfirm={() =>
            withActionErrors(async () => {
              await api.deleteCustomer(product.id, deleteCustomer.id, actorLabel);
              setProduct((p) =>
                p ? { ...p, customers: p.customers.filter((x) => x.id !== deleteCustomer.id) } : p
              );
              setDeleteCustomer(null);
            })
          }
          onCancel={() => setDeleteCustomer(null)}
        />
      )}

      {showAddSupplier && (
        <SupplierForm
          onSubmit={async (values: SupplierFormValues) =>
            withActionErrors(async () => {
              const s = await api.addSupplier(product.id, values, actorLabel);
              setProduct((p) => (p ? { ...p, suppliers: [...p.suppliers, s] } : p));
              setShowAddSupplier(false);
            })
          }
          onClose={() => setShowAddSupplier(false)}
        />
      )}

      {editSupplier && (
        <SupplierForm
          initial={editSupplier}
          onSubmit={async (values: SupplierFormValues) =>
            withActionErrors(async () => {
              const s = await api.updateSupplier(product.id, editSupplier.id, values, actorLabel);
              setProduct((p) =>
                p ? { ...p, suppliers: p.suppliers.map((x) => (x.id === s.id ? s : x)) } : p
              );
              setEditSupplier(null);
            })
          }
          onClose={() => setEditSupplier(null)}
        />
      )}

      {deleteSupplier && (
        <ConfirmDialog
          title="Remove supplier"
          message={`Remove "${deleteSupplier.name}" from this product's supplier list?`}
          confirmLabel="Remove"
          danger
          onConfirm={() =>
            withActionErrors(async () => {
              await api.deleteSupplier(product.id, deleteSupplier.id, actorLabel);
              setProduct((p) =>
                p ? { ...p, suppliers: p.suppliers.filter((x) => x.id !== deleteSupplier.id) } : p
              );
              setDeleteSupplier(null);
            })
          }
          onCancel={() => setDeleteSupplier(null)}
        />
      )}

      {showAddComponent && (
        <ComponentForm
          onSubmit={async (values: ComponentFormValues) =>
            withActionErrors(async () => {
              const c = await api.addComponent(product.id, values, actorLabel);
              setProduct((p) => (p ? { ...p, components: [...p.components, c] } : p));
              setShowAddComponent(false);
            })
          }
          onClose={() => setShowAddComponent(false)}
        />
      )}

      {editComponent && (
        <ComponentForm
          initial={editComponent}
          onSubmit={async (values: ComponentFormValues) =>
            withActionErrors(async () => {
              const c = await api.updateComponent(product.id, editComponent.id, values, actorLabel);
              setProduct((p) =>
                p ? { ...p, components: p.components.map((x) => (x.id === c.id ? c : x)) } : p
              );
              setEditComponent(null);
            })
          }
          onClose={() => setEditComponent(null)}
        />
      )}

      {deleteComponent && (
        <ConfirmDialog
          title="Remove component"
          message={`Remove "${deleteComponent.name}" from this product's BOM?`}
          confirmLabel="Remove"
          danger
          onConfirm={() =>
            withActionErrors(async () => {
              await api.deleteComponent(product.id, deleteComponent.id, actorLabel);
              setProduct((p) =>
                p ? { ...p, components: p.components.filter((x) => x.id !== deleteComponent.id) } : p
              );
              setDeleteComponent(null);
            })
          }
          onCancel={() => setDeleteComponent(null)}
        />
      )}
    </div>
  );
}
