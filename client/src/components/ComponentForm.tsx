import { useState, type FormEvent } from "react";
import type { Component } from "../types";
import Modal from "./Modal";

export type ComponentFormValues = Omit<Component, "id">;

interface Props {
  initial?: Component;
  onSubmit: (values: ComponentFormValues) => Promise<void>;
  onClose: () => void;
}

export default function ComponentForm({ initial, onSubmit, onClose }: Props) {
  const [values, setValues] = useState<ComponentFormValues>({
    partNumber: initial?.partNumber ?? "",
    name: initial?.name ?? "",
    quantity: initial?.quantity ?? 1,
    unitCost: initial?.unitCost ?? 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof ComponentFormValues>(key: K, value: ComponentFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Component name is required.");
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
    <Modal title={initial ? "Edit component" : "Add component"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="stacked-form">
        {error && <div className="form-error">{error}</div>}
        <div className="field-row">
          <label>
            Part number
            <input value={values.partNumber} onChange={(e) => update("partNumber", e.target.value)} />
          </label>
          <label>
            Component name
            <input value={values.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
        </div>
        <div className="field-row">
          <label>
            Quantity per unit
            <input
              type="number"
              min="0"
              step="1"
              value={values.quantity}
              onChange={(e) => update("quantity", Number(e.target.value))}
            />
          </label>
          <label>
            Unit cost (USD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={values.unitCost}
              onChange={(e) => update("unitCost", Number(e.target.value))}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save component"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
