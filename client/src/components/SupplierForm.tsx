import { useState, type FormEvent } from "react";
import type { Supplier } from "../types";
import Modal from "./Modal";

export type SupplierFormValues = Omit<Supplier, "id">;

interface Props {
  initial?: Supplier;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
  onClose: () => void;
}

export default function SupplierForm({ initial, onSubmit, onClose }: Props) {
  const [values, setValues] = useState<SupplierFormValues>({
    name: initial?.name ?? "",
    company: initial?.company ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    material: initial?.material ?? "",
    leadTimeDays: initial?.leadTimeDays ?? 0,
    country: initial?.country ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof SupplierFormValues>(key: K, value: SupplierFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Supplier name is required.");
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
    <Modal title={initial ? "Edit supplier" : "Add supplier"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="stacked-form">
        {error && <div className="form-error">{error}</div>}
        <div className="field-row">
          <label>
            Supplier name
            <input value={values.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
          <label>
            Company
            <input value={values.company} onChange={(e) => update("company", e.target.value)} />
          </label>
        </div>
        <div className="field-row">
          <label>
            Email
            <input type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
          </label>
          <label>
            Phone
            <input value={values.phone} onChange={(e) => update("phone", e.target.value)} />
          </label>
        </div>
        <div className="field-row">
          <label>
            Material / Component supplied
            <input value={values.material} onChange={(e) => update("material", e.target.value)} />
          </label>
          <label>
            Lead time (days)
            <input
              type="number"
              min="0"
              value={values.leadTimeDays}
              onChange={(e) => update("leadTimeDays", Number(e.target.value))}
            />
          </label>
        </div>
        <label>
          Country
          <input value={values.country} onChange={(e) => update("country", e.target.value)} />
        </label>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save supplier"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
