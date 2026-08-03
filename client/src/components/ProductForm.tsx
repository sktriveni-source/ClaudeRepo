import { useState, type FormEvent } from "react";
import type { Product } from "../types";
import Modal from "./Modal";

export interface ProductFormValues {
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  cost: number;
  owner: string;
}

interface Props {
  title: string;
  initial?: Product;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onClose: () => void;
}

export default function ProductForm({ title, initial, submitLabel, onSubmit, onClose }: Props) {
  const [values, setValues] = useState<ProductFormValues>({
    name: initial?.name ?? "",
    sku: initial?.sku ?? "",
    category: initial?.category ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    cost: initial?.cost ?? 0,
    owner: initial?.owner ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.name.trim() || !values.sku.trim()) {
      setError("Name and SKU are required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="stacked-form">
        {error && <div className="form-error">{error}</div>}
        <div className="field-row">
          <label>
            Product name
            <input value={values.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
          <label>
            SKU
            <input value={values.sku} onChange={(e) => update("sku", e.target.value)} required />
          </label>
        </div>
        <div className="field-row">
          <label>
            Category
            <input value={values.category} onChange={(e) => update("category", e.target.value)} />
          </label>
          <label>
            Owner
            <input value={values.owner} onChange={(e) => update("owner", e.target.value)} />
          </label>
        </div>
        <label>
          Description
          <textarea
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
          />
        </label>
        <div className="field-row">
          <label>
            Price (USD)
            <input
              type="number"
              step="0.01"
              min="0"
              value={values.price}
              onChange={(e) => update("price", Number(e.target.value))}
            />
          </label>
          <label>
            Cost (USD)
            <input
              type="number"
              step="0.01"
              min="0"
              value={values.cost}
              onChange={(e) => update("cost", Number(e.target.value))}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
