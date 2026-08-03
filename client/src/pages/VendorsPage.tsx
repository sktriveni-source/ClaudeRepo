import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Vendor, VendorType } from "../types";

const TYPE_LABELS: Record<VendorType, string> = {
  RAW_MATERIAL: "Raw Material Supplier",
  MANUFACTURING: "Manufacturing Vendor",
  BOTH: "Raw Material + Manufacturing",
};

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<VendorType>("RAW_MATERIAL");
  const [contactEmail, setContactEmail] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    api
      .listVendors()
      .then(setVendors)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load vendors"));
  }

  useEffect(refresh, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    try {
      await api.createVendor({ name, type, contactEmail, location });
      setName("");
      setContactEmail("");
      setLocation("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vendor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Suppliers & Vendors</h1>
      <p className="page__subtitle">
        Directory of raw material suppliers and manufacturing vendors used for RFQs.
      </p>

      <form className="card form form--inline" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as VendorType)}>
            <option value="RAW_MATERIAL">Raw Material Supplier</option>
            <option value="MANUFACTURING">Manufacturing Vendor</option>
            <option value="BOTH">Both</option>
          </select>
        </label>
        <label>
          Contact email
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </label>
        <label>
          Location
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <button type="submit" className="primary" disabled={submitting}>
          Add vendor
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {!vendors && !error && <p>Loading…</p>}

      {vendors && (
        <div className="card">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td>
                  <td>{TYPE_LABELS[v.type]}</td>
                  <td>{v.contactEmail || "—"}</td>
                  <td>{v.location || "—"}</td>
                  <td>{v.rating != null ? v.rating.toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
