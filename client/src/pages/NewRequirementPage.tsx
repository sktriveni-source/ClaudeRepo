import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

interface MaterialDraft {
  name: string;
  quantity: string;
  unit: string;
}

export function NewRequirementPage() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [materials, setMaterials] = useState<MaterialDraft[]>([
    { name: "", quantity: "", unit: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateMaterial(index: number, field: keyof MaterialDraft, value: string) {
    setMaterials((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addMaterialRow() {
    setMaterials((rows) => [...rows, { name: "", quantity: "", unit: "" }]);
  }

  function removeMaterialRow(index: number) {
    setMaterials((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerName || !productName || !quantity) {
      setError("Customer name, product name and quantity are required.");
      return;
    }
    const cleanMaterials = materials
      .filter((m) => m.name.trim())
      .map((m) => ({ name: m.name, quantity: Number(m.quantity) || 0, unit: m.unit }));

    setSubmitting(true);
    try {
      const order = await api.createOrder({
        customerName,
        customerEmail,
        productName,
        quantity: Number(quantity),
        specifications,
        materials: cleanMaterials,
      });
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create requirement order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>New Requirement Order</h1>
      <p className="page__subtitle">
        Capture the customer's product requirement to kick off raw material procurement and
        manufacturing.
      </p>
      <form className="card form" onSubmit={handleSubmit}>
        <div className="form__row">
          <label>
            Customer name
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </label>
          <label>
            Customer email
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </label>
        </div>
        <div className="form__row">
          <label>
            Product to manufacture
            <input value={productName} onChange={(e) => setProductName(e.target.value)} required />
          </label>
          <label>
            Quantity
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>
        </div>
        <label>
          Specifications
          <textarea
            value={specifications}
            onChange={(e) => setSpecifications(e.target.value)}
            rows={3}
            placeholder="Dimensions, tolerances, finish, packaging, etc."
          />
        </label>

        <fieldset>
          <legend>Raw materials needed</legend>
          {materials.map((m, i) => (
            <div className="form__row form__row--material" key={i}>
              <input
                placeholder="Material name"
                value={m.name}
                onChange={(e) => updateMaterial(i, "name", e.target.value)}
              />
              <input
                placeholder="Qty"
                type="number"
                value={m.quantity}
                onChange={(e) => updateMaterial(i, "quantity", e.target.value)}
              />
              <input
                placeholder="Unit"
                value={m.unit}
                onChange={(e) => updateMaterial(i, "unit", e.target.value)}
              />
              {materials.length > 1 && (
                <button type="button" className="ghost" onClick={() => removeMaterialRow(i)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" className="ghost" onClick={addMaterialRow}>
            + Add material
          </button>
        </fieldset>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create requirement order"}
        </button>
      </form>
    </div>
  );
}
