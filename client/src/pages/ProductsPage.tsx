import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import ConfirmDialog from "../components/ConfirmDialog";
import ProductForm, { type ProductFormValues } from "../components/ProductForm";
import StageBadge from "../components/StageBadge";
import { useUser } from "../context/UserContext";
import type { Product, Stage, StageId } from "../types";

export default function ProductsPage() {
  const navigate = useNavigate();
  const { actorLabel } = useUser();

  const [products, setProducts] = useState<Product[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<StageId | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [productList, stageList] = await Promise.all([api.listProducts(), api.getStages()]);
      setProducts(productList);
      setStages(stageList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (stageFilter !== "ALL" && p.lifecycleStage !== stageFilter) return false;
      if (categoryFilter !== "ALL" && p.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [products, stageFilter, categoryFilter, search]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of stages) counts[s.id] = 0;
    for (const p of products) counts[p.lifecycleStage] = (counts[p.lifecycleStage] || 0) + 1;
    return counts;
  }, [products, stages]);

  async function handleCreate(values: ProductFormValues) {
    const created = await api.createProduct(values, actorLabel);
    setShowCreate(false);
    setProducts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    navigate(`/products/${created.id}`);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.deleteProduct(deleteTarget.id, actorLabel);
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  if (loading) return <div className="state-message">Loading products…</div>;
  if (error) return <div className="state-message error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="page-subtitle">
            Centrally managed catalog of every product and its lifecycle stage.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New product
        </button>
      </div>

      <div className="stage-summary">
        {stages.map((s) => (
          <button
            key={s.id}
            className={`stage-chip stage-${s.id.toLowerCase()} ${stageFilter === s.id ? "active" : ""}`}
            onClick={() => setStageFilter(stageFilter === s.id ? "ALL" : s.id)}
          >
            <span className="stage-chip-count">{stageCounts[s.id] ?? 0}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="ALL">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="state-message">No products match the current filters.</div>
      ) : (
        <div className="product-grid">
          {filtered.map((p) => (
            <div key={p.id} className="product-card" onClick={() => navigate(`/products/${p.id}`)}>
              <div className="product-card-top">
                <h3>{p.name}</h3>
                <StageBadge stage={p.lifecycleStage} />
              </div>
              <p className="product-sku">SKU {p.sku}</p>
              <p className="product-description">{p.description || "No description yet."}</p>
              <div className="product-card-meta">
                <span>{p.category}</span>
                <span>${p.price.toFixed(2)}</span>
                <span>{p.owner}</span>
              </div>
              <div className="product-card-footer">
                <span>{p.customers.length} customers</span>
                <span>{p.suppliers.length} suppliers</span>
                <button
                  className="btn btn-danger-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(p);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <ProductForm
          title="Create product"
          submitLabel="Create product"
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete product"
          message={`Delete "${deleteTarget.name}"? This removes its customers, suppliers, and workflow history.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
