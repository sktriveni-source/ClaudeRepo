import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import type { RequirementOrder, Vendor } from "../types";
import { StageStepper } from "../components/StageStepper";
import { StatusBadge } from "../components/StatusBadge";
import { RfqPanel } from "../components/RfqPanel";
import { ApprovalBanner } from "../components/ApprovalBanner";
import { RAW_MATERIAL_STAGES, MANUFACTURING_STAGES } from "../constants";

const ACTOR_STORAGE_KEY = "supplyflow.actor";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<RequirementOrder | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actor, setActor] = useState(() => localStorage.getItem(ACTOR_STORAGE_KEY) || "");

  useEffect(() => {
    localStorage.setItem(ACTOR_STORAGE_KEY, actor);
  }, [actor]);

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

      <div className="card actor-bar">
        <label>
          Acting as
          <input
            placeholder="Your name / role, e.g. Raj (Procurement)"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
        </label>
        <p className="muted">
          Used to attribute the actions and approval decisions you make below — every transaction on
          this order records who did what and when.
        </p>
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

      {order.pendingApproval ? (
        <ApprovalBanner order={order} busy={busy} run={run} />
      ) : (
        <>
          {order.phase === "RAW_MATERIALS" && (
            <RawMaterialPanel order={order} vendors={vendors} busy={busy} run={run} actor={actor} />
          )}
          {order.phase === "MANUFACTURING" && (
            <ManufacturingPanel order={order} vendors={vendors} busy={busy} run={run} actor={actor} />
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
        </>
      )}

      <ApprovalsHistory order={order} />
      <TransactionsLedger order={order} />
    </div>
  );
}

interface PanelProps {
  order: RequirementOrder;
  vendors: Vendor[];
  busy: boolean;
  run: <T>(action: () => Promise<T>) => Promise<T>;
  actor: string;
}

function ActorHint({ actor }: { actor: string }) {
  if (actor) return null;
  return <p className="error">Enter your name in "Acting as" above before taking an action.</p>;
}

function RawMaterialPanel({ order, vendors, busy, run, actor }: PanelProps) {
  const rm = order.rawMaterial;
  const rawVendors = vendors.filter((v) => v.type === "RAW_MATERIAL" || v.type === "BOTH");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [receiptQty, setReceiptQty] = useState("");
  const [receiptCondition, setReceiptCondition] = useState("GOOD");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");

  const canAct = busy || !actor;
  const acceptedRfq = rm.rfqs.find((r) => r.status === "ACCEPTED");

  function toggleVendor(id: string) {
    setSelectedVendors((sel) => (sel.includes(id) ? sel.filter((v) => v !== id) : [...sel, id]));
  }

  return (
    <div className="card">
      <h2>Raw Material Procurement — {rm.stage.replace(/_/g, " ")}</h2>
      <ActorHint actor={actor} />

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
        <button className="primary" disabled={canAct} onClick={() => run(() => api.placeRawMaterialOrder(order.id, actor))}>
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
            disabled={canAct || selectedVendors.length === 0}
            onClick={() => run(() => api.sourceRawMaterialVendors(order.id, selectedVendors, actor))}
          >
            Raise RFQ with selected suppliers
          </button>
        </div>
      )}

      {rm.stage === "RFQ" && !rm.purchaseOrder && !acceptedRfq && (
        <RfqPanel
          rfqs={rm.rfqs}
          disabled={canAct}
          onQuote={async (rfqId, price, lead) => {
            await run(() => api.quoteRawMaterialRfq(order.id, rfqId, price, lead));
          }}
          onAccept={async (rfqId) => {
            await run(() => api.submitAcceptRawMaterialRfq(order.id, rfqId, actor));
          }}
        />
      )}

      {rm.stage === "RFQ" && !rm.purchaseOrder && acceptedRfq && (
        <div>
          <p>
            <strong>{acceptedRfq.vendorName}</strong>'s quote of ${acceptedRfq.quotedPrice} was approved.
            Submit the purchase order to place it with the supplier.
          </p>
          <button
            className="primary"
            disabled={canAct}
            onClick={() => run(() => api.submitPlaceRawMaterialOrder(order.id, actor))}
          >
            Submit purchase order for approval
          </button>
        </div>
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
            disabled={canAct || !receiptQty}
            onClick={() =>
              run(() =>
                api.submitRawMaterialGoodsReceipt(order.id, {
                  receivedQty: Number(receiptQty),
                  condition: receiptCondition,
                  notes: receiptNotes,
                  requestedBy: actor,
                })
              )
            }
          >
            Submit goods receipt for approval
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
            disabled={canAct || !invoiceNumber || !invoiceAmount}
            onClick={() =>
              run(() =>
                api.submitRawMaterialInvoice(order.id, {
                  invoiceNumber,
                  amount: Number(invoiceAmount),
                  requestedBy: actor,
                })
              )
            }
          >
            Submit supplier invoice for approval
          </button>
        </div>
      )}

      {rm.stage === "INVOICE" && rm.invoice && (
        <div>
          <p>
            Invoice {rm.invoice.invoiceNumber} for ${rm.invoice.amount} — <StatusBadge label={rm.invoice.status} />
          </p>
          <button
            className="primary"
            disabled={canAct}
            onClick={() => run(() => api.payRawMaterialInvoice(order.id, actor))}
          >
            Mark invoice paid & proceed to manufacturing
          </button>
        </div>
      )}
    </div>
  );
}

function ManufacturingPanel({ order, vendors, busy, run, actor }: PanelProps) {
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

  const canAct = busy || !actor;
  const acceptedRfq = mfg.rfqs.find((r) => r.status === "ACCEPTED");

  function toggleVendor(id: string) {
    setSelectedVendors((sel) => (sel.includes(id) ? sel.filter((v) => v !== id) : [...sel, id]));
  }

  return (
    <div className="card">
      <h2>Manufacturing & Distribution — {mfg.stage?.replace(/_/g, " ")}</h2>
      <ActorHint actor={actor} />

      {mfg.stage === "PLACE_ORDER" && (
        <button
          className="primary"
          disabled={canAct}
          onClick={() => run(() => api.placeManufacturingOrder(order.id, actor))}
        >
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
                disabled={canAct || selectedVendors.length === 0}
                onClick={() =>
                  run(() =>
                    api.selectManufacturingMode(order.id, {
                      mode: "EXTERNAL",
                      vendorIds: selectedVendors,
                      requestedBy: actor,
                    })
                  )
                }
              >
                Raise RFQ with selected vendors
              </button>
            </div>
          )}

          {mode === "INHOUSE" && (
            <div>
              <p className="muted">
                In-house manufacturing skips the RFQ round, but placing the job order still needs
                approval.
              </p>
              <input
                placeholder="In-house unit name"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
              />
              <button
                className="primary"
                disabled={canAct || !unitName}
                onClick={() =>
                  run(() =>
                    api.selectManufacturingMode(order.id, { mode: "INHOUSE", unitName, requestedBy: actor })
                  )
                }
              >
                Submit in-house job order for approval
              </button>
            </div>
          )}
        </div>
      )}

      {mfg.stage === "RFQ" && !mfg.order && !acceptedRfq && (
        <RfqPanel
          rfqs={mfg.rfqs}
          disabled={canAct}
          onQuote={async (rfqId, price, lead) => {
            await run(() => api.quoteManufacturingRfq(order.id, rfqId, price, lead));
          }}
          onAccept={async (rfqId) => {
            await run(() => api.submitAcceptManufacturingRfq(order.id, rfqId, actor));
          }}
        />
      )}

      {mfg.stage === "RFQ" && !mfg.order && acceptedRfq && (
        <div>
          <p>
            <strong>{acceptedRfq.vendorName}</strong>'s quote of ${acceptedRfq.quotedPrice} was approved.
            Submit the manufacturing order to place it with the vendor.
          </p>
          <button
            className="primary"
            disabled={canAct}
            onClick={() => run(() => api.submitPlaceManufacturingOrder(order.id, actor))}
          >
            Submit manufacturing order for approval
          </button>
        </div>
      )}

      {mfg.stage === "ORDER" && mfg.order && (
        <div>
          <p>
            Manufacturing order placed with <strong>{mfg.order.vendorName}</strong>.
          </p>
          <button
            className="primary"
            disabled={canAct}
            onClick={() => run(() => api.completeManufacturingOrder(order.id, actor))}
          >
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
            disabled={canAct || !producedQty || !warehouseLocation}
            onClick={() =>
              run(() =>
                api.submitInventory(order.id, {
                  producedQty: Number(producedQty),
                  warehouseLocation,
                  requestedBy: actor,
                })
              )
            }
          >
            Submit inventory for approval
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
            disabled={canAct || !carrier}
            onClick={() =>
              run(() => api.submitDistribution(order.id, { carrier, shipmentId, requestedBy: actor }))
            }
          >
            Submit dispatch for approval
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
            disabled={canAct || !deliveryAddress || !recipient}
            onClick={() =>
              run(() =>
                api.submitDelivery(order.id, { deliveryAddress, recipient, requestedBy: actor })
              )
            }
          >
            Submit delivery for approval
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
            disabled={canAct || !receivedQty || !confirmedBy}
            onClick={() =>
              run(() =>
                api.submitManufacturingGoodsReceipt(order.id, {
                  receivedQty: Number(receivedQty),
                  confirmedBy,
                  requestedBy: actor,
                })
              )
            }
          >
            Submit customer goods receipt for approval
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
            disabled={canAct || !invoiceNumber || !invoiceAmount}
            onClick={() =>
              run(() =>
                api.submitManufacturingInvoice(order.id, {
                  invoiceNumber,
                  amount: Number(invoiceAmount),
                  requestedBy: actor,
                })
              )
            }
          >
            Submit customer invoice for approval
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
            disabled={canAct}
            onClick={() =>
              run(() => api.submitBilling(order.id, { paymentStatus, requestedBy: actor }))
            }
          >
            Submit billing for approval
          </button>
        </div>
      )}

      {mfg.stage === "BILLING" && mfg.billing && (
        <div>
          <p>
            Billed on {new Date(mfg.billing.billedAt).toLocaleString()} — payment{" "}
            {mfg.billing.paymentStatus}.
          </p>
          <button className="primary" disabled={canAct} onClick={() => run(() => api.closeOrder(order.id, actor))}>
            Close requirement order
          </button>
        </div>
      )}
    </div>
  );
}

function ApprovalsHistory({ order }: { order: RequirementOrder }) {
  if (order.approvals.length === 0) return null;
  return (
    <div className="card">
      <h2>Approval History</h2>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Request</th>
            <th>Requested by</th>
            <th>Status</th>
            <th>Decided by</th>
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
          {[...order.approvals].reverse().map((a) => (
            <tr key={a.id}>
              <td>
                <StatusBadge label={a.category} />
              </td>
              <td>{a.summary}</td>
              <td>
                {a.requestedBy}
                <div className="muted">{new Date(a.requestedAt).toLocaleString()}</div>
              </td>
              <td>
                <StatusBadge label={a.status} />
              </td>
              <td>
                {a.decidedBy || "—"}
                {a.decidedAt && <div className="muted">{new Date(a.decidedAt).toLocaleString()}</div>}
              </td>
              <td>{a.comments || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionsLedger({ order }: { order: RequirementOrder }) {
  return (
    <div className="card">
      <h2>Transaction Ledger</h2>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Category</th>
            <th>Type</th>
            <th>Actor</th>
            <th>Details</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {[...order.transactions].reverse().map((t) => (
            <tr key={t.id}>
              <td className="nowrap">{new Date(t.ts).toLocaleString()}</td>
              <td>
                <StatusBadge label={t.category} />
              </td>
              <td>
                <StatusBadge label={t.type} />
              </td>
              <td>{t.actor}</td>
              <td>{t.message}</td>
              <td>{t.amount != null ? `$${t.amount}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
