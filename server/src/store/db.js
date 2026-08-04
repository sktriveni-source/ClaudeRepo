import { nextId } from "../utils/ids.js";
import { seedVendors } from "../data/vendors.js";

export const RAW_MATERIAL_STAGES = [
  "PLACE_ORDER",
  "SOURCING",
  "RFQ",
  "ORDER",
  "GOODS_RECEIPT",
  "INVOICE",
  "DONE",
];

export const MANUFACTURING_STAGES = [
  "PLACE_ORDER",
  "MODE_SELECTION",
  "RFQ",
  "ORDER",
  "ORDER_COMPLETE",
  "INVENTORY",
  "DISTRIBUTION",
  "DELIVERY",
  "GOODS_RECEIPT",
  "INVOICE",
  "BILLING",
  "DONE",
];

// Approval categories: every transition tagged with one of these requires an
// explicit approve/reject decision before it takes effect.
export const APPROVAL_CATEGORIES = [
  "RFQ",
  "ORDER",
  "GOODS_RECEIPT",
  "INVOICE",
  "INVENTORY",
  "DISTRIBUTION",
  "DELIVERY",
  "BILLING",
];

const vendors = new Map(seedVendors.map((v) => [v.id, { ...v }]));
const orders = new Map();

export function listVendors(type) {
  const all = [...vendors.values()];
  if (!type) return all;
  return all.filter((v) => v.type === type || v.type === "BOTH");
}

export function getVendor(id) {
  return vendors.get(id) || null;
}

export function createVendor({ name, type, contactEmail, location }) {
  const vendor = {
    id: nextId("vnd"),
    name,
    type,
    contactEmail: contactEmail || "",
    location: location || "",
    rating: null,
  };
  vendors.set(vendor.id, vendor);
  return vendor;
}

// ---------- Transaction ledger ----------
// Every state-changing event on an order - direct actions, approval
// submissions, approval decisions, and the business action executed once
// approved - is appended here so the full history of the order can always
// be reconstructed.

function pushTransaction(order, { phase, stage, category, type, actor, message, amount, refId }) {
  const txn = {
    id: nextId("txn"),
    ts: new Date().toISOString(),
    phase,
    stage,
    category: category || "GENERAL",
    type,
    actor: actor || "Unknown",
    message,
    amount: amount ?? null,
    refId: refId || null,
  };
  order.transactions.push(txn);
  return txn;
}

function assertStage(current, expected, label) {
  if (current !== expected) {
    const err = new Error(`${label} requires stage ${expected}, order is at ${current}`);
    err.status = 409;
    throw err;
  }
}

function assertNoPendingApproval(order) {
  if (order.pendingApproval) {
    const err = new Error(
      `Order already has a pending ${order.pendingApproval.category} approval awaiting a decision`
    );
    err.status = 409;
    throw err;
  }
}

// ---------- Order creation ----------

export function createOrder({
  customerName,
  customerEmail,
  productName,
  quantity,
  specifications,
  materials,
}) {
  const order = {
    id: nextId("req"),
    customerName,
    customerEmail,
    productName,
    quantity,
    specifications: specifications || "",
    createdAt: new Date().toISOString(),
    phase: "RAW_MATERIALS",
    closedAt: null,
    pendingApproval: null,
    approvals: [],
    rawMaterial: {
      stage: "PLACE_ORDER",
      materials: (materials || []).map((m) => ({
        id: nextId("mat"),
        name: m.name,
        quantity: m.quantity,
        unit: m.unit || "",
      })),
      candidateVendorIds: [],
      rfqs: [],
      purchaseOrder: null,
      goodsReceipt: null,
      invoice: null,
    },
    manufacturing: {
      stage: null,
      mode: null,
      vendorId: null,
      vendorName: null,
      rfqs: [],
      order: null,
      orderCompletedAt: null,
      inventory: null,
      distribution: null,
      delivery: null,
      goodsReceipt: null,
      invoice: null,
      billing: null,
    },
    transactions: [],
  };
  pushTransaction(order, {
    phase: "RAW_MATERIALS",
    stage: "PLACE_ORDER",
    category: "GENERAL",
    type: "CREATED",
    actor: "System",
    message: `Requirement received from ${customerName} for ${quantity} unit(s) of ${productName}.`,
  });
  orders.set(order.id, order);
  return order;
}

export function listOrders() {
  return [...orders.values()];
}

export function getOrder(id) {
  return orders.get(id) || null;
}

// ---------- Generic approval workflow ----------
//
// A gated transition is requested via `requestApproval`, which snapshots the
// data needed to perform it (the `payload`) and records who asked for it.
// Nothing changes on the order's business state until an approver calls
// `decideApproval`: REJECTED discards the request (the requester can
// resubmit), APPROVED runs the matching executor from EXECUTORS, which is
// the only place that actually mutates rawMaterial/manufacturing state for
// gated steps.

function requestApproval(order, { category, phase, stage, action, payload, requestedBy, summary }) {
  assertNoPendingApproval(order);
  if (!requestedBy) {
    const err = new Error("requestedBy is required to submit for approval");
    err.status = 400;
    throw err;
  }
  const approval = {
    id: nextId("apr"),
    category,
    phase,
    stage,
    action,
    payload,
    summary,
    status: "PENDING",
    requestedBy,
    requestedAt: new Date().toISOString(),
    decidedBy: null,
    decidedAt: null,
    comments: null,
  };
  order.approvals.push(approval);
  order.pendingApproval = approval;
  pushTransaction(order, {
    phase,
    stage,
    category,
    type: "SUBMITTED",
    actor: requestedBy,
    message: `${summary} submitted for approval.`,
    refId: approval.id,
  });
  return approval;
}

export function decideApproval(order, approvalId, { decision, decidedBy, comments }) {
  const approval = order.approvals.find((a) => a.id === approvalId);
  if (!approval) {
    const err = new Error("Approval request not found");
    err.status = 404;
    throw err;
  }
  if (approval.status !== "PENDING") {
    const err = new Error("Approval request has already been decided");
    err.status = 409;
    throw err;
  }
  if (!order.pendingApproval || order.pendingApproval.id !== approvalId) {
    const err = new Error("Approval request is no longer the order's pending approval");
    err.status = 409;
    throw err;
  }
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    const err = new Error("decision must be APPROVED or REJECTED");
    err.status = 400;
    throw err;
  }
  if (!decidedBy) {
    const err = new Error("decidedBy is required to decide an approval");
    err.status = 400;
    throw err;
  }

  approval.status = decision;
  approval.decidedBy = decidedBy;
  approval.decidedAt = new Date().toISOString();
  approval.comments = comments || null;
  order.pendingApproval = null;

  pushTransaction(order, {
    phase: approval.phase,
    stage: approval.stage,
    category: approval.category,
    type: decision,
    actor: decidedBy,
    message: `${approval.summary} ${decision.toLowerCase()}${comments ? ` — "${comments}"` : ""}.`,
    refId: approval.id,
  });

  if (decision === "APPROVED") {
    const executor = EXECUTORS[approval.action];
    executor(order, approval.payload, decidedBy);
  }

  return order;
}

export function listApprovals(status) {
  const results = [];
  for (const order of orders.values()) {
    for (const approval of order.approvals) {
      if (!status || approval.status === status) {
        results.push({
          ...approval,
          orderId: order.id,
          customerName: order.customerName,
          productName: order.productName,
        });
      }
    }
  }
  results.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  return results;
}

// ---------- Raw material procurement ----------

export function placeRawMaterialOrder(order, actor) {
  assertStage(order.rawMaterial.stage, "PLACE_ORDER", "Placing raw material order");
  order.rawMaterial.stage = "SOURCING";
  pushTransaction(order, {
    phase: "RAW_MATERIALS",
    stage: "SOURCING",
    type: "ACTION",
    actor,
    message: "Raw material order placed. Sourcing suppliers.",
  });
  return order;
}

export function sourceRawMaterialVendors(order, vendorIds, actor) {
  assertStage(order.rawMaterial.stage, "SOURCING", "Sourcing suppliers");
  if (!vendorIds || vendorIds.length === 0) {
    const err = new Error("Select at least one supplier/vendor to source from");
    err.status = 400;
    throw err;
  }
  order.rawMaterial.candidateVendorIds = vendorIds;
  order.rawMaterial.rfqs = vendorIds.map((vendorId) => {
    const vendor = getVendor(vendorId);
    return {
      id: nextId("rfq"),
      vendorId,
      vendorName: vendor ? vendor.name : "Unknown vendor",
      status: "SENT",
      quotedPrice: null,
      leadTimeDays: null,
      sentAt: new Date().toISOString(),
      quotedAt: null,
    };
  });
  order.rawMaterial.stage = "RFQ";
  pushTransaction(order, {
    phase: "RAW_MATERIALS",
    stage: "RFQ",
    category: "RFQ",
    type: "ACTION",
    actor,
    message: `RFQ raised with ${order.rawMaterial.rfqs.length} supplier(s): ${order.rawMaterial.rfqs
      .map((r) => r.vendorName)
      .join(", ")}.`,
  });
  return order;
}

export function quoteRawMaterialRfq(order, rfqId, quotedPrice, leadTimeDays, actor) {
  assertStage(order.rawMaterial.stage, "RFQ", "Recording a supplier quote");
  const rfq = order.rawMaterial.rfqs.find((r) => r.id === rfqId);
  if (!rfq) {
    const err = new Error("RFQ not found");
    err.status = 404;
    throw err;
  }
  rfq.quotedPrice = quotedPrice;
  rfq.leadTimeDays = leadTimeDays;
  rfq.status = "QUOTED";
  rfq.quotedAt = new Date().toISOString();
  pushTransaction(order, {
    phase: "RAW_MATERIALS",
    stage: "RFQ",
    category: "RFQ",
    type: "ACTION",
    actor: actor || rfq.vendorName,
    message: `${rfq.vendorName} quoted $${quotedPrice} with ${leadTimeDays} day lead time.`,
    amount: quotedPrice,
    refId: rfq.id,
  });
  return order;
}

export function submitAcceptRawMaterialRfq(order, rfqId, requestedBy) {
  assertStage(order.rawMaterial.stage, "RFQ", "Accepting a supplier quote");
  const rfq = order.rawMaterial.rfqs.find((r) => r.id === rfqId);
  if (!rfq) {
    const err = new Error("RFQ not found");
    err.status = 404;
    throw err;
  }
  if (rfq.status !== "QUOTED") {
    const err = new Error("RFQ must be quoted before it can be accepted");
    err.status = 409;
    throw err;
  }
  requestApproval(order, {
    category: "RFQ",
    phase: "RAW_MATERIALS",
    stage: "RFQ",
    action: "rm-accept-rfq",
    payload: { rfqId },
    requestedBy,
    summary: `Accept ${rfq.vendorName}'s quote of $${rfq.quotedPrice} for raw materials`,
  });
  return order;
}

function _rmAcceptRfq(order, { rfqId }, actor) {
  const rfq = order.rawMaterial.rfqs.find((r) => r.id === rfqId);
  rfq.status = "ACCEPTED";
  order.rawMaterial.rfqs
    .filter((r) => r.id !== rfqId && r.status !== "ACCEPTED")
    .forEach((r) => (r.status = "REJECTED"));
  pushTransaction(order, {
    phase: "RAW_MATERIALS",
    stage: "RFQ",
    category: "RFQ",
    type: "ACTION",
    actor,
    message: `${rfq.vendorName}'s quote accepted for raw materials.`,
    amount: rfq.quotedPrice,
    refId: rfq.id,
  });
}

export function submitPlaceRawMaterialOrder(order, requestedBy) {
  assertStage(order.rawMaterial.stage, "RFQ", "Placing the raw material purchase order");
  const rfq = order.rawMaterial.rfqs.find((r) => r.status === "ACCEPTED");
  if (!rfq) {
    const err = new Error("Accept a supplier's quote before placing the order");
    err.status = 409;
    throw err;
  }
  requestApproval(order, {
    category: "ORDER",
    phase: "RAW_MATERIALS",
    stage: "RFQ",
    action: "rm-place-order",
    payload: { rfqId: rfq.id },
    requestedBy,
    summary: `Place purchase order with ${rfq.vendorName} for $${rfq.quotedPrice}`,
  });
  return order;
}

function _rmPlaceOrder(order, { rfqId }, actor) {
  const rfq = order.rawMaterial.rfqs.find((r) => r.id === rfqId);
  order.rawMaterial.purchaseOrder = {
    id: nextId("po"),
    vendorId: rfq.vendorId,
    vendorName: rfq.vendorName,
    rfqId: rfq.id,
    amount: rfq.quotedPrice,
    placedAt: new Date().toISOString(),
    status: "PLACED",
  };
  order.rawMaterial.stage = "ORDER";
  pushTransaction(order, {
    phase: "RAW_MATERIALS",
    stage: "ORDER",
    category: "ORDER",
    type: "ACTION",
    actor,
    message: `Purchase order placed with ${rfq.vendorName} for $${rfq.quotedPrice}.`,
    amount: rfq.quotedPrice,
    refId: order.rawMaterial.purchaseOrder.id,
  });
}

export function submitRawMaterialGoodsReceipt(order, { receivedQty, condition, notes }, requestedBy) {
  assertStage(order.rawMaterial.stage, "ORDER", "Recording goods receipt");
  requestApproval(order, {
    category: "GOODS_RECEIPT",
    phase: "RAW_MATERIALS",
    stage: "ORDER",
    action: "rm-goods-receipt",
    payload: { receivedQty, condition: condition || "GOOD", notes: notes || "" },
    requestedBy,
    summary: `Goods receipt of ${receivedQty} unit(s) from ${order.rawMaterial.purchaseOrder?.vendorName}`,
  });
  return order;
}

function _rmGoodsReceipt(order, { receivedQty, condition, notes }, actor) {
  order.rawMaterial.goodsReceipt = {
    receivedQty,
    condition,
    notes,
    receivedDate: new Date().toISOString(),
  };
  order.rawMaterial.stage = "GOODS_RECEIPT";
  pushTransaction(order, {
    phase: "RAW_MATERIALS",
    stage: "GOODS_RECEIPT",
    category: "GOODS_RECEIPT",
    type: "ACTION",
    actor,
    message: `Goods receipt recorded: ${receivedQty} unit(s) received in ${condition} condition.`,
  });
}

export function submitRawMaterialInvoice(order, { invoiceNumber, amount }, requestedBy) {
  assertStage(order.rawMaterial.stage, "GOODS_RECEIPT", "Recording supplier invoice");
  requestApproval(order, {
    category: "INVOICE",
    phase: "RAW_MATERIALS",
    stage: "GOODS_RECEIPT",
    action: "rm-invoice",
    payload: { invoiceNumber, amount },
    requestedBy,
    summary: `Supplier invoice ${invoiceNumber} for $${amount}`,
  });
  return order;
}

function _rmInvoice(order, { invoiceNumber, amount }, actor) {
  order.rawMaterial.invoice = {
    invoiceNumber,
    amount,
    status: "PENDING",
    receivedAt: new Date().toISOString(),
    paidAt: null,
  };
  order.rawMaterial.stage = "INVOICE";
  pushTransaction(order, {
    phase: "RAW_MATERIALS",
    stage: "INVOICE",
    category: "INVOICE",
    type: "ACTION",
    actor,
    message: `Supplier invoice ${invoiceNumber} recorded for $${amount}.`,
    amount,
  });
}

export function payRawMaterialInvoice(order, actor) {
  assertStage(order.rawMaterial.stage, "INVOICE", "Paying supplier invoice");
  if (!order.rawMaterial.invoice) {
    const err = new Error("No invoice recorded yet");
    err.status = 409;
    throw err;
  }
  order.rawMaterial.invoice.status = "PAID";
  order.rawMaterial.invoice.paidAt = new Date().toISOString();
  order.rawMaterial.stage = "DONE";
  order.phase = "MANUFACTURING";
  order.manufacturing.stage = "PLACE_ORDER";
  pushTransaction(order, {
    phase: "RAW_MATERIALS",
    stage: "DONE",
    category: "INVOICE",
    type: "ACTION",
    actor,
    message: "Supplier invoice paid. Raw materials procurement complete.",
    amount: order.rawMaterial.invoice.amount,
  });
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "PLACE_ORDER",
    type: "ACTION",
    actor,
    message: "Raw materials received. Ready to place manufacturing order.",
  });
  return order;
}

// ---------- Manufacturing, inventory & distribution ----------

function assertManufacturingStage(order, expected, label) {
  assertStage(order.manufacturing.stage, expected, label);
}

export function placeManufacturingOrder(order, actor) {
  assertManufacturingStage(order, "PLACE_ORDER", "Placing manufacturing order");
  order.manufacturing.stage = "MODE_SELECTION";
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "MODE_SELECTION",
    type: "ACTION",
    actor,
    message: "Manufacturing order placed. Choosing external vendor or in-house unit.",
  });
  return order;
}

export function selectManufacturingMode(order, { mode, vendorIds, unitName }, actor) {
  assertManufacturingStage(order, "MODE_SELECTION", "Selecting manufacturing mode");
  if (mode !== "EXTERNAL" && mode !== "INHOUSE") {
    const err = new Error("mode must be EXTERNAL or INHOUSE");
    err.status = 400;
    throw err;
  }

  if (mode === "EXTERNAL") {
    if (!vendorIds || vendorIds.length === 0) {
      const err = new Error("Select at least one external vendor to send an RFQ to");
      err.status = 400;
      throw err;
    }
    order.manufacturing.mode = "EXTERNAL";
    order.manufacturing.rfqs = vendorIds.map((vendorId) => {
      const vendor = getVendor(vendorId);
      return {
        id: nextId("rfq"),
        vendorId,
        vendorName: vendor ? vendor.name : "Unknown vendor",
        status: "SENT",
        quotedPrice: null,
        leadTimeDays: null,
        sentAt: new Date().toISOString(),
        quotedAt: null,
      };
    });
    order.manufacturing.stage = "RFQ";
    pushTransaction(order, {
      phase: "MANUFACTURING",
      stage: "RFQ",
      category: "RFQ",
      type: "ACTION",
      actor,
      message: `External manufacturing selected. RFQ raised with ${order.manufacturing.rfqs
        .map((r) => r.vendorName)
        .join(", ")}.`,
    });
    return order;
  }

  // In-house manufacturing skips the RFQ round entirely, but placing the job
  // order still needs approval like any other "Order placed" step.
  const chosenUnitName = unitName || "In-house manufacturing unit";
  requestApproval(order, {
    category: "ORDER",
    phase: "MANUFACTURING",
    stage: "MODE_SELECTION",
    action: "mfg-place-order-inhouse",
    payload: { unitName: chosenUnitName },
    requestedBy: actor,
    summary: `Place in-house manufacturing job order at ${chosenUnitName}`,
  });
  return order;
}

function _mfgPlaceOrderInhouse(order, { unitName }, actor) {
  order.manufacturing.mode = "INHOUSE";
  order.manufacturing.vendorName = unitName;
  order.manufacturing.order = {
    id: nextId("mo"),
    vendorId: null,
    vendorName: unitName,
    placedAt: new Date().toISOString(),
    status: "PLACED",
  };
  order.manufacturing.stage = "ORDER";
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "ORDER",
    category: "ORDER",
    type: "ACTION",
    actor,
    message: `In-house manufacturing job order placed at ${unitName}.`,
    refId: order.manufacturing.order.id,
  });
}

export function quoteManufacturingRfq(order, rfqId, quotedPrice, leadTimeDays, actor) {
  assertManufacturingStage(order, "RFQ", "Recording a manufacturing vendor quote");
  const rfq = order.manufacturing.rfqs.find((r) => r.id === rfqId);
  if (!rfq) {
    const err = new Error("RFQ not found");
    err.status = 404;
    throw err;
  }
  rfq.quotedPrice = quotedPrice;
  rfq.leadTimeDays = leadTimeDays;
  rfq.status = "QUOTED";
  rfq.quotedAt = new Date().toISOString();
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "RFQ",
    category: "RFQ",
    type: "ACTION",
    actor: actor || rfq.vendorName,
    message: `${rfq.vendorName} quoted $${quotedPrice} with ${leadTimeDays} day lead time.`,
    amount: quotedPrice,
    refId: rfq.id,
  });
  return order;
}

export function submitAcceptManufacturingRfq(order, rfqId, requestedBy) {
  assertManufacturingStage(order, "RFQ", "Accepting a manufacturing vendor quote");
  const rfq = order.manufacturing.rfqs.find((r) => r.id === rfqId);
  if (!rfq) {
    const err = new Error("RFQ not found");
    err.status = 404;
    throw err;
  }
  if (rfq.status !== "QUOTED") {
    const err = new Error("RFQ must be quoted before it can be accepted");
    err.status = 409;
    throw err;
  }
  requestApproval(order, {
    category: "RFQ",
    phase: "MANUFACTURING",
    stage: "RFQ",
    action: "mfg-accept-rfq",
    payload: { rfqId },
    requestedBy,
    summary: `Accept ${rfq.vendorName}'s manufacturing quote of $${rfq.quotedPrice}`,
  });
  return order;
}

function _mfgAcceptRfq(order, { rfqId }, actor) {
  const rfq = order.manufacturing.rfqs.find((r) => r.id === rfqId);
  rfq.status = "ACCEPTED";
  order.manufacturing.rfqs
    .filter((r) => r.id !== rfqId && r.status !== "ACCEPTED")
    .forEach((r) => (r.status = "REJECTED"));
  order.manufacturing.vendorId = rfq.vendorId;
  order.manufacturing.vendorName = rfq.vendorName;
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "RFQ",
    category: "RFQ",
    type: "ACTION",
    actor,
    message: `${rfq.vendorName}'s manufacturing quote accepted.`,
    amount: rfq.quotedPrice,
    refId: rfq.id,
  });
}

export function submitPlaceManufacturingOrder(order, requestedBy) {
  assertManufacturingStage(order, "RFQ", "Placing the manufacturing order");
  const rfq = order.manufacturing.rfqs.find((r) => r.status === "ACCEPTED");
  if (!rfq) {
    const err = new Error("Accept a vendor's quote before placing the order");
    err.status = 409;
    throw err;
  }
  requestApproval(order, {
    category: "ORDER",
    phase: "MANUFACTURING",
    stage: "RFQ",
    action: "mfg-place-order-external",
    payload: { rfqId: rfq.id },
    requestedBy,
    summary: `Place manufacturing order with ${rfq.vendorName} for $${rfq.quotedPrice}`,
  });
  return order;
}

function _mfgPlaceOrderExternal(order, { rfqId }, actor) {
  const rfq = order.manufacturing.rfqs.find((r) => r.id === rfqId);
  order.manufacturing.order = {
    id: nextId("mo"),
    vendorId: rfq.vendorId,
    vendorName: rfq.vendorName,
    placedAt: new Date().toISOString(),
    status: "PLACED",
  };
  order.manufacturing.stage = "ORDER";
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "ORDER",
    category: "ORDER",
    type: "ACTION",
    actor,
    message: `Manufacturing order placed with ${rfq.vendorName} for $${rfq.quotedPrice}.`,
    amount: rfq.quotedPrice,
    refId: order.manufacturing.order.id,
  });
}

export function completeManufacturingOrder(order, actor) {
  assertManufacturingStage(order, "ORDER", "Completing manufacturing order");
  order.manufacturing.order.status = "COMPLETE";
  order.manufacturing.orderCompletedAt = new Date().toISOString();
  order.manufacturing.stage = "ORDER_COMPLETE";
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "ORDER_COMPLETE",
    category: "ORDER",
    type: "ACTION",
    actor,
    message: `Manufacturing complete at ${order.manufacturing.vendorName}.`,
  });
  return order;
}

export function submitInventory(order, { producedQty, warehouseLocation }, requestedBy) {
  assertManufacturingStage(order, "ORDER_COMPLETE", "Recording inventory");
  requestApproval(order, {
    category: "INVENTORY",
    phase: "MANUFACTURING",
    stage: "ORDER_COMPLETE",
    action: "mfg-inventory",
    payload: { producedQty, warehouseLocation },
    requestedBy,
    summary: `Stock ${producedQty} unit(s) at ${warehouseLocation}`,
  });
  return order;
}

function _mfgInventory(order, { producedQty, warehouseLocation }, actor) {
  order.manufacturing.inventory = {
    producedQty,
    warehouseLocation,
    stockedAt: new Date().toISOString(),
  };
  order.manufacturing.stage = "INVENTORY";
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "INVENTORY",
    category: "INVENTORY",
    type: "ACTION",
    actor,
    message: `${producedQty} unit(s) stocked at ${warehouseLocation}.`,
  });
}

export function submitDistribution(order, { carrier, shipmentId }, requestedBy) {
  assertManufacturingStage(order, "INVENTORY", "Dispatching for distribution");
  requestApproval(order, {
    category: "DISTRIBUTION",
    phase: "MANUFACTURING",
    stage: "INVENTORY",
    action: "mfg-distribution",
    payload: { carrier, shipmentId: shipmentId || nextId("ship") },
    requestedBy,
    summary: `Dispatch shipment via ${carrier}`,
  });
  return order;
}

function _mfgDistribution(order, { carrier, shipmentId }, actor) {
  order.manufacturing.distribution = {
    carrier,
    shipmentId,
    dispatchedAt: new Date().toISOString(),
  };
  order.manufacturing.stage = "DISTRIBUTION";
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "DISTRIBUTION",
    category: "DISTRIBUTION",
    type: "ACTION",
    actor,
    message: `Shipment ${shipmentId} dispatched via ${carrier} to move product to customer.`,
    refId: shipmentId,
  });
}

export function submitDelivery(order, { deliveryAddress, recipient }, requestedBy) {
  assertManufacturingStage(order, "DISTRIBUTION", "Recording delivery");
  requestApproval(order, {
    category: "DELIVERY",
    phase: "MANUFACTURING",
    stage: "DISTRIBUTION",
    action: "mfg-delivery",
    payload: { deliveryAddress, recipient },
    requestedBy,
    summary: `Deliver to ${recipient} at ${deliveryAddress}`,
  });
  return order;
}

function _mfgDelivery(order, { deliveryAddress, recipient }, actor) {
  order.manufacturing.delivery = {
    deliveryAddress,
    recipient,
    deliveredAt: new Date().toISOString(),
  };
  order.manufacturing.stage = "DELIVERY";
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "DELIVERY",
    category: "DELIVERY",
    type: "ACTION",
    actor,
    message: `Product delivered to ${recipient} at ${deliveryAddress}.`,
  });
}

export function submitManufacturingGoodsReceipt(order, { receivedQty, confirmedBy }, requestedBy) {
  assertManufacturingStage(order, "DELIVERY", "Recording customer goods receipt");
  requestApproval(order, {
    category: "GOODS_RECEIPT",
    phase: "MANUFACTURING",
    stage: "DELIVERY",
    action: "mfg-goods-receipt",
    payload: { receivedQty, confirmedBy },
    requestedBy,
    summary: `Customer receipt of ${receivedQty} unit(s) confirmed by ${confirmedBy}`,
  });
  return order;
}

function _mfgGoodsReceipt(order, { receivedQty, confirmedBy }, actor) {
  order.manufacturing.goodsReceipt = {
    receivedQty,
    confirmedBy,
    confirmedAt: new Date().toISOString(),
  };
  order.manufacturing.stage = "GOODS_RECEIPT";
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "GOODS_RECEIPT",
    category: "GOODS_RECEIPT",
    type: "ACTION",
    actor,
    message: `Customer confirmed receipt of ${receivedQty} unit(s).`,
  });
}

export function submitManufacturingInvoice(order, { invoiceNumber, amount }, requestedBy) {
  assertManufacturingStage(order, "GOODS_RECEIPT", "Issuing customer invoice");
  requestApproval(order, {
    category: "INVOICE",
    phase: "MANUFACTURING",
    stage: "GOODS_RECEIPT",
    action: "mfg-invoice",
    payload: { invoiceNumber, amount },
    requestedBy,
    summary: `Customer invoice ${invoiceNumber} for $${amount}`,
  });
  return order;
}

function _mfgInvoice(order, { invoiceNumber, amount }, actor) {
  order.manufacturing.invoice = {
    invoiceNumber,
    amount,
    status: "ISSUED",
    issuedAt: new Date().toISOString(),
    paidAt: null,
  };
  order.manufacturing.stage = "INVOICE";
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "INVOICE",
    category: "INVOICE",
    type: "ACTION",
    actor,
    message: `Invoice ${invoiceNumber} issued to ${order.customerName} for $${amount}.`,
    amount,
  });
}

export function submitBilling(order, { paymentStatus }, requestedBy) {
  assertManufacturingStage(order, "INVOICE", "Recording billing");
  requestApproval(order, {
    category: "BILLING",
    phase: "MANUFACTURING",
    stage: "INVOICE",
    action: "mfg-billing",
    payload: { paymentStatus: paymentStatus || "PAID" },
    requestedBy,
    summary: `Bill customer, payment status ${paymentStatus || "PAID"}`,
  });
  return order;
}

function _mfgBilling(order, { paymentStatus }, actor) {
  order.manufacturing.invoice.status = "PAID";
  order.manufacturing.invoice.paidAt = new Date().toISOString();
  order.manufacturing.billing = {
    paymentStatus,
    billedAt: new Date().toISOString(),
  };
  order.manufacturing.stage = "BILLING";
  pushTransaction(order, {
    phase: "MANUFACTURING",
    stage: "BILLING",
    category: "BILLING",
    type: "ACTION",
    actor,
    message: `Billing complete, payment status: ${paymentStatus}.`,
    amount: order.manufacturing.invoice.amount,
  });
}

export function closeRequirementOrder(order, actor) {
  assertManufacturingStage(order, "BILLING", "Closing the requirement order");
  order.manufacturing.stage = "DONE";
  order.phase = "CLOSED";
  order.closedAt = new Date().toISOString();
  pushTransaction(order, {
    phase: "CLOSED",
    stage: "DONE",
    type: "CLOSED",
    actor,
    message: "Requirement order closed.",
  });
  return order;
}

const EXECUTORS = {
  "rm-accept-rfq": _rmAcceptRfq,
  "rm-place-order": _rmPlaceOrder,
  "rm-goods-receipt": _rmGoodsReceipt,
  "rm-invoice": _rmInvoice,
  "mfg-place-order-inhouse": _mfgPlaceOrderInhouse,
  "mfg-accept-rfq": _mfgAcceptRfq,
  "mfg-place-order-external": _mfgPlaceOrderExternal,
  "mfg-inventory": _mfgInventory,
  "mfg-distribution": _mfgDistribution,
  "mfg-delivery": _mfgDelivery,
  "mfg-goods-receipt": _mfgGoodsReceipt,
  "mfg-invoice": _mfgInvoice,
  "mfg-billing": _mfgBilling,
};
