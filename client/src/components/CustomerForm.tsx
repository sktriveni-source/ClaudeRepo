import { useState, type FormEvent } from "react";
import type { Customer } from "../types";
import Modal from "./Modal";

export type CustomerFormValues = Omit<Customer, "id">;

interface Props {
  initial?: Customer;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onClose: () => void;
}

export default function CustomerForm({ initial, onSubmit, onClose }: Props) {
  const [values, setValues] = useState<CustomerFormValues>({
    name: initial?.name ?? "",
    company: initial?.company ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    region: initial?.region ?? "",
    since: initial?.since ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Customer name is required.");
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
    <Modal title={initial ? "Edit customer" : "Add customer"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="stacked-form">
        {error && <div className="form-error">{error}</div>}
        <div className="field-row">
          <label>
            Name / Contact
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
            Region
            <input value={values.region} onChange={(e) => update("region", e.target.value)} />
          </label>
          <label>
            Customer since
            <input type="date" value={values.since} onChange={(e) => update("since", e.target.value)} />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save customer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
