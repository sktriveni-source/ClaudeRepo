import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import type { RequirementOrder, Vendor } from "../types";
import { StageStepper } from "../components/StageStepper";
import { StatusBadge } from "../components/StatusBadge";
import { RfqPanel } from "../components/RfqPanel";
import { RAW_MATERIAL_STAGES, MANUFACTURING_STAGES } from "../constants";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<RequirementOrder | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    if (!id) return;
    api.getOrder(id).then(setOrder).catch((err) => setError(err.message));
  }, [id]);

  useEffect(refresh, [refresh]);
  useEffect(() => {
    api.listVendors().then(setVendors).catch(() => {});
  }, []);

  async function run<T>(action: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      setOrder(result as unknown as RequirementOrder);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  if (!order) {
    return <div className="page">{error ? <p className="error">{error}</p> : <p>Loading…</p>}</div>;
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>
            {order.productName} <span className="order-id">#{order.id}</span>
          </h1>
          <p className="page__subtitle">
            {order.customerName} {order.customerEmail && `· ${order.customerEmail}`} · Qty{" "}
            {order.quantity}
          </p>
          {order.specifications && <p className="specs">{order.specifications}</p>}
        </div>
        <StatusBadge label={order.phase} />
      </div>

      {error && <p className="error">{error}</p>}

      <div className="steppers">
        <StageStepper
          title="Raw Material Procurement"
          stages={RAW_MATERIAL_STAGES}
          currentStage={order.phase === "RAW_MATERIALS" ? order.rawMaterial.stage : "DONE"}
        />
        <StageStepper
          title="Manufacturing & Distribution"
          stages={MANUFACTURING_STAGES}
          currentStage={
            order.phase === "CLOSED" ? "DONE" : order.phase === "MANUFACTURING" ? order.manufacturing.stage : null
          }
        />
      </div>

      {order.phase === "RAW_MATERIALS" && (
        <RawMaterialPanel order={order} vendors={vendors} busy={busy} run={run} />
      )}
      {order.phase === "MANUFACTURING" && (
        <ManufacturingPanel order={order} vendors={vendors} busy={busy} run={run} />
      )}
      {order.phase === "CLOSED" && (
        <div className="card">
          <h2>Requirement order closed</h2>
          <p>
            Closed on {order.closedAt && new Date(order.closedAt).toLocaleString()}. This
            requirement has been fully delivered, invoiced and billed.
          </p>
        </div>
      )}

      <div className="card">
        <h2>Timeline</h2>
        <ul className="timeline">
          {order.timeline.map((event, i) => (
            <li key={i}>
              <span className="timeline__ts">{new Date(event.ts).toLocaleString()}</span>
              <span className="timeline__msg">{event.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface PanelProps {
  order: RequirementOrder;
  vendors: Vendor[];
  busy: boolean;
  run: <T>(action: () => Promise<T>) => Promise<T>;
}

function RawMaterialPanel({ order, vendors, busy, run }: PanelProps) {
  const rm = order.rawMaterial;
  const rawVendors = vendors.filter((v) => v.type === "RAW_MATERIAL" || v.type === "BOTH");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [receiptQty, setReceiptQty] = useState("");
  const [receiptCondition, setReceiptCondition] = useState("GOOD");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");

  function toggleVendor(id: string) {
    setSelectedVendors((sel) => (sel.includes(id) ? sel.filter((v) => v !== id) : [...sel, id]));
  }

  return (
    <div className="card">
      <h2>Raw Material Procurement — {rm.stage.replace(/_/g, " ")}</h2>

      {rm.materials.length > 0 && (
        <div className="materials-list">
          <strong>Materials requested:</strong>
          <ul>
            {rm.materials.map((m) => (
              <li key={m.id}>
                {m.name} — {m.quantity} {m.unit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rm.stage === "PLACE_ORDER" && (
        <button className="primary" disabled={busy} onClick={() => run(() => api.placeRawMaterialOrder(order.id))}>
          Place order for raw materials
        </button>
      )}

      {rm.stage === "SOURCING" && (
        <div>
          <p>Select suppliers/vendors to raise an RFQ with:</p>
          <div className="vendor-checklist">
            {rawVendors.map((v) => (
              <label key={v.id}>
                <input
                  type="checkbox"
                  checked={selectedVendors.includes(v.id)}
                  onChange={() => toggleVendor(v.id)}
                />
                {v.name} <span className="muted">({v.location})</span>
              </label>
            ))}
          </div>
          <button
            className="primary"
            disabled={busy || selectedVendors.length === 0}
            onClick={() => run(() => api.sourceRawMaterialVendors(order.id, selectedVendors))}
          >
            Raise RFQ with selected suppliers
          </button>
        </div>
      )}

      {rm.stage === "RFQ" && (
        <RfqPanel
          rfqs={rm.rfqs}
          disabled={busy}
          onQuote={async (rfqId, price, lead) => {
            await run(() => api.quoteRawMaterialRfq(order.id, rfqId, price, lead));
          }}
          onAccept={async (rfqId) => {
            await run(() => api.acceptRawMaterialRfq(order.id, rfqId));
          }}
        />
      )}

      {rm.stage === "ORDER" && rm.purchaseOrder && (
        <div>
          <p>
            Purchase order placed with <strong>{rm.purchaseOrder.vendorName}</strong> for $
            {rm.purchaseOrder.amount}.
          </p>
          <h3>Goods receipt</h3>
          <div className="form__row">
            <input
              type="number"
              placeholder="Received qty"
              value={receiptQty}
              onChange={(e) => setReceiptQty(e.target.value)}
            />
            <select value={receiptCondition} onChange={(e) => setReceiptCondition(e.target.value)}>
              <option value="GOOD">Good</option>
              <option value="DAMAGED">Damaged</option>
              <option value="PARTIAL">Partial</option>
            </select>
            <input
              placeholder="Notes (optional)"
              value={receiptNotes}
              onChange={(e) => setReceiptNotes(e.target.value)}
            />
          </div>
          <button
            className="primary"
            disabled={busy || !receiptQty}
            onClick={() =>
              run(() =>
                api.recordRawMaterialGoodsReceipt(order.id, {
                  receivedQty: Number(receiptQty),
                  condition: receiptCondition,
                  notes: receiptNotes,
                })
              )
            }
          >
            Record goods receipt
          </button>
        </div>
      )}

      {rm.stage === "GOODS_RECEIPT" && rm.goodsReceipt && (
        <div>
          <p>
            Received {rm.goodsReceipt.receivedQty} unit(s), condition {rm.goodsReceipt.condition}.
          </p>
          <h3>Supplier invoice</h3>
          <div className="form__row">
            <input
              placeholder="Invoice number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount $"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
            />
          </div>
          <button
            className="primary"
            disabled={busy || !invoiceNumber || !invoiceAmount}
            onClick={() =>
              run(() =>
                api.recordRawMaterialInvoice(order.id, {
                  invoiceNumber,
                  amount: Number(invoiceAmount),
                })
              )
            }
          >
            Record supplier invoice
          </button>
        </div>
      )}

      {rm.stage === "INVOICE" && rm.invoice && (
        <div>
          <p>
            Invoice {rm.invoice.invoiceNumber} for ${rm.invoice.amount} — <StatusBadge label={rm.invoice.status} />
          </p>
          <button className="primary" disabled={busy} onClick={() => run(() => api.payRawMaterialInvoice(order.id))}>
            Mark invoice paid & proceed to manufacturing
          </button>
        </div>
      )}
    </div>
  );
}

function ManufacturingPanel({ order, vendors, busy, run }: PanelProps) {
  const mfg = order.manufacturing;
  const mfgVendors = vendors.filter((v) => v.type === "MANUFACTURING" || v.type === "BOTH");
  const [mode, setMode] = useState<"EXTERNAL" | "INHOUSE">("EXTERNAL");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [unitName, setUnitName] = useState("Central In-house Manufacturing Unit");
  const [producedQty, setProducedQty] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [carrier, setCarrier] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [recipient, setRecipient] = useState("");
  const [receivedQty, setReceivedQty] = useState("");
  const [confirmedBy, setConfirmedBy] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PAID");

  function toggleVendor(id: string) {
    setSelectedVendors((sel) => (sel.includes(id) ? sel.filter((v) => v !== id) : [...sel, id]));
  }

  return (
    <div className="card">
      <h2>Manufacturing & Distribution — {mfg.stage?.replace(/_/g, " ")}</h2>

      {mfg.stage === "PLACE_ORDER" && (
        <button className="primary" disabled={busy} onClick={() => run(() => api.placeManufacturingOrder(order.id))}>
          Place order for manufacturing
        </button>
      )}

      {mfg.stage === "MODE_SELECTION" && (
        <div>
          <div className="mode-select">
            <label>
              <input
                type="radio"
                checked={mode === "EXTERNAL"}
                onChange={() => setMode("EXTERNAL")}
              />
              External vendor/supplier
            </label>
            <label>
              <input
                type="radio"
                checked={mode === "INHOUSE"}
                onChange={() => setMode("INHOUSE")}
              />
              In-house manufacturing unit
            </label>
          </div>

          {mode === "EXTERNAL" && (
            <div>
              <p>Select external manufacturing vendors to raise an RFQ with:</p>
              <div className="vendor-checklist">
                {mfgVendors.map((v) => (
                  <label key={v.id}>
                    <input
                      type="checkbox"
                      checked={selectedVendors.includes(v.id)}
                      onChange={() => toggleVendor(v.id)}
                    />
                    {v.name} <span className="muted">({v.location})</span>
                  </label>
                ))}
              </div>
              <button
                className="primary"
                disabled={busy || selectedVendors.length === 0}
                onClick={() =>
                  run(() =>
                    api.selectManufacturingMode(order.id, { mode: "EXTERNAL", vendorIds: selectedVendors })
                  )
                }
              >
                Raise RFQ with selected vendors
              </button>
            </div>
          )}

          {mode === "INHOUSE" && (
            <div>
              <input
                placeholder="In-house unit name"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
              />
              <button
                className="primary"
                disabled={busy || !unitName}
                onClick={() =>
                  run(() => api.selectManufacturingMode(order.id, { mode: "INHOUSE", unitName }))
                }
              >
                Assign in-house unit & place order
              </button>
            </div>
          )}
        </div>
      )}

      {mfg.stage === "RFQ" && (
        <RfqPanel
          rfqs={mfg.rfqs}
          disabled={busy}
          onQuote={async (rfqId, price, lead) => {
            await run(() => api.quoteManufacturingRfq(order.id, rfqId, price, lead));
          }}
          onAccept={async (rfqId) => {
            await run(() => api.acceptManufacturingRfq(order.id, rfqId));
          }}
        />
      )}

      {mfg.stage === "ORDER" && mfg.order && (
        <div>
          <p>
            Manufacturing order placed with <strong>{mfg.order.vendorName}</strong>.
          </p>
          <button className="primary" disabled={busy} onClick={() => run(() => api.completeManufacturingOrder(order.id))}>
            Mark manufacturing order complete
          </button>
        </div>
      )}

      {mfg.stage === "ORDER_COMPLETE" && (
        <div>
          <p>Manufacturing complete. Log finished goods into inventory:</p>
          <div className="form__row">
            <input
              type="number"
              placeholder="Produced qty"
              value={producedQty}
              onChange={(e) => setProducedQty(e.target.value)}
            />
            <input
              placeholder="Warehouse location"
              value={warehouseLocation}
              onChange={(e) => setWarehouseLocation(e.target.value)}
            />
          </div>
          <button
            className="primary"
            disabled={busy || !producedQty || !warehouseLocation}
            onClick={() =>
              run(() =>
                api.recordInventory(order.id, {
                  producedQty: Number(producedQty),
                  warehouseLocation,
                })
              )
            }
          >
            Record inventory
          </button>
        </div>
      )}

      {mfg.stage === "INVENTORY" && mfg.inventory && (
        <div>
          <p>
            {mfg.inventory.producedQty} unit(s) stocked at {mfg.inventory.warehouseLocation}.
          </p>
          <h3>Dispatch for distribution</h3>
          <div className="form__row">
            <input placeholder="Carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
            <input
              placeholder="Shipment ID (optional)"
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
            />
          </div>
          <button
            className="primary"
            disabled={busy || !carrier}
            onClick={() => run(() => api.recordDistribution(order.id, { carrier, shipmentId }))}
          >
            Dispatch shipment to move product to customer
          </button>
        </div>
      )}

      {mfg.stage === "DISTRIBUTION" && mfg.distribution && (
        <div>
          <p>
            Shipment {mfg.distribution.shipmentId} dispatched via {mfg.distribution.carrier}.
          </p>
          <h3>Delivery</h3>
          <div className="form__row">
            <input
              placeholder="Delivery address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
            <input
              placeholder="Recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <button
            className="primary"
            disabled={busy || !deliveryAddress || !recipient}
            onClick={() => run(() => api.recordDelivery(order.id, { deliveryAddress, recipient }))}
          >
            Mark delivered
          </button>
        </div>
      )}

      {mfg.stage === "DELIVERY" && mfg.delivery && (
        <div>
          <p>
            Delivered to {mfg.delivery.recipient} at {mfg.delivery.deliveryAddress}.
          </p>
          <h3>Customer goods receipt</h3>
          <div className="form__row">
            <input
              type="number"
              placeholder="Received qty"
              value={receivedQty}
              onChange={(e) => setReceivedQty(e.target.value)}
            />
            <input
              placeholder="Confirmed by"
              value={confirmedBy}
              onChange={(e) => setConfirmedBy(e.target.value)}
            />
          </div>
          <button
            className="primary"
            disabled={busy || !receivedQty || !confirmedBy}
            onClick={() =>
              run(() =>
                api.recordCustomerGoodsReceipt(order.id, {
                  receivedQty: Number(receivedQty),
                  confirmedBy,
                })
              )
            }
          >
            Confirm customer goods receipt
          </button>
        </div>
      )}

      {mfg.stage === "GOODS_RECEIPT" && mfg.goodsReceipt && (
        <div>
          <p>
            Customer confirmed receipt of {mfg.goodsReceipt.receivedQty} unit(s) via {mfg.goodsReceipt.confirmedBy}.
          </p>
          <h3>Customer invoice</h3>
          <div className="form__row">
            <input
              placeholder="Invoice number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount $"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
            />
          </div>
          <button
            className="primary"
            disabled={busy || !invoiceNumber || !invoiceAmount}
            onClick={() =>
              run(() =>
                api.recordCustomerInvoice(order.id, {
                  invoiceNumber,
                  amount: Number(invoiceAmount),
                })
              )
            }
          >
            Issue customer invoice
          </button>
        </div>
      )}

      {mfg.stage === "INVOICE" && mfg.invoice && (
        <div>
          <p>
            Invoice {mfg.invoice.invoiceNumber} for ${mfg.invoice.amount} —{" "}
            <StatusBadge label={mfg.invoice.status} />
          </p>
          <h3>Billing</h3>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
          </select>
          <button
            className="primary"
            disabled={busy}
            onClick={() => run(() => api.recordBilling(order.id, { paymentStatus }))}
          >
            Record billing
          </button>
        </div>
      )}

      {mfg.stage === "BILLING" && mfg.billing && (
        <div>
          <p>
            Billed on {new Date(mfg.billing.billedAt).toLocaleString()} — payment{" "}
            {mfg.billing.paymentStatus}.
          </p>
          <button className="primary" disabled={busy} onClick={() => run(() => api.closeOrder(order.id))}>
            Close requirement order
          </button>
        </div>
      )}
    </div>
  );
}
