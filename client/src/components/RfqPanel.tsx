import { useState } from "react";
import type { Rfq } from "../types";
import { StatusBadge } from "./StatusBadge";

interface RfqPanelProps {
  rfqs: Rfq[];
  onQuote: (rfqId: string, quotedPrice: number, leadTimeDays: number) => Promise<void>;
  onAccept: (rfqId: string) => Promise<void>;
  disabled?: boolean;
}

export function RfqPanel({ rfqs, onQuote, onAccept, disabled }: RfqPanelProps) {
  const [drafts, setDrafts] = useState<Record<string, { price: string; lead: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const draftFor = (id: string) => drafts[id] || { price: "", lead: "" };

  async function submitQuote(rfq: Rfq) {
    const draft = draftFor(rfq.id);
    const price = Number(draft.price);
    const lead = Number(draft.lead);
    if (!price || !lead) return;
    setBusyId(rfq.id);
    try {
      await onQuote(rfq.id, price, lead);
    } finally {
      setBusyId(null);
    }
  }

  async function submitAccept(rfq: Rfq) {
    setBusyId(rfq.id);
    try {
      await onAccept(rfq.id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <table className="rfq-table">
      <thead>
        <tr>
          <th>Vendor</th>
          <th>Status</th>
          <th>Quote</th>
          <th>Lead time</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rfqs.map((rfq) => (
          <tr key={rfq.id}>
            <td>{rfq.vendorName}</td>
            <td>
              <StatusBadge label={rfq.status} />
            </td>
            <td>
              {rfq.status === "SENT" && !disabled ? (
                <input
                  type="number"
                  placeholder="Price $"
                  value={draftFor(rfq.id).price}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [rfq.id]: { ...draftFor(rfq.id), price: e.target.value } }))
                  }
                />
              ) : (
                rfq.quotedPrice != null && `$${rfq.quotedPrice}`
              )}
            </td>
            <td>
              {rfq.status === "SENT" && !disabled ? (
                <input
                  type="number"
                  placeholder="Days"
                  value={draftFor(rfq.id).lead}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [rfq.id]: { ...draftFor(rfq.id), lead: e.target.value } }))
                  }
                />
              ) : (
                rfq.leadTimeDays != null && `${rfq.leadTimeDays} day(s)`
              )}
            </td>
            <td>
              {rfq.status === "SENT" && !disabled && (
                <button disabled={busyId === rfq.id} onClick={() => submitQuote(rfq)}>
                  Record quote
                </button>
              )}
              {rfq.status === "QUOTED" && !disabled && (
                <button className="primary" disabled={busyId === rfq.id} onClick={() => submitAccept(rfq)}>
                  Accept & place order
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
