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

function logEvent(order, phase, stage, message) {
  order.timeline.push({ ts: new Date().toISOString(), phase, stage, message });
}

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
    timeline: [],
  };
  logEvent(
    order,
    "RAW_MATERIALS",
    "PLACE_ORDER",
    `Requirement received from ${customerName} for ${quantity} unit(s) of ${productName}.`
  );
  orders.set(order.id, order);
  return order;
}

export function listOrders() {
  return [...orders.values()];
}

export function getOrder(id) {
  return orders.get(id) || null;
}

function assertStage(current, expected, label) {
  if (current !== expected) {
    const err = new Error(
      `${label} requires stage ${expected}, order is at ${current}`
    );
    err.status = 409;
    throw err;
  }
}

// ---------- Raw material procurement ----------

export function placeRawMaterialOrder(order) {
  assertStage(order.rawMaterial.stage, "PLACE_ORDER", "Placing raw material order");
  order.rawMaterial.stage = "SOURCING";
  logEvent(order, "RAW_MATERIALS", "SOURCING", "Raw material order placed. Sourcing suppliers.");
  return order;
}

export function sourceRawMaterialVendors(order, vendorIds) {
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
  logEvent(
    order,
    "RAW_MATERIALS",
    "RFQ",
    `RFQ raised with ${order.rawMaterial.rfqs.length} supplier(s): ${order.rawMaterial.rfqs
      .map((r) => r.vendorName)
      .join(", ")}.`
  );
  return order;
}

export function quoteRawMaterialRfq(order, rfqId, quotedPrice, leadTimeDays) {
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
  logEvent(
    order,
    "RAW_MATERIALS",
    "RFQ",
    `${rfq.vendorName} quoted $${quotedPrice} with ${leadTimeDays} day lead time.`
  );
  return order;
}

export function acceptRawMaterialRfq(order, rfqId) {
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
  rfq.status = "ACCEPTED";
  order.rawMaterial.rfqs
    .filter((r) => r.id !== rfqId && r.status !== "ACCEPTED")
    .forEach((r) => (r.status = "REJECTED"));
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
  logEvent(
    order,
    "RAW_MATERIALS",
    "ORDER",
    `Purchase order placed with ${rfq.vendorName} for $${rfq.quotedPrice}.`
  );
  return order;
}

export function recordRawMaterialGoodsReceipt(order, { receivedQty, condition, notes }) {
  assertStage(order.rawMaterial.stage, "ORDER", "Recording goods receipt");
  order.rawMaterial.goodsReceipt = {
    receivedQty,
    condition: condition || "GOOD",
    notes: notes || "",
    receivedDate: new Date().toISOString(),
  };
  order.rawMaterial.stage = "GOODS_RECEIPT";
  logEvent(
    order,
    "RAW_MATERIALS",
    "GOODS_RECEIPT",
    `Goods receipt recorded: ${receivedQty} unit(s) received in ${condition || "GOOD"} condition.`
  );
  return order;
}

export function recordRawMaterialInvoice(order, { invoiceNumber, amount }) {
  assertStage(order.rawMaterial.stage, "GOODS_RECEIPT", "Recording supplier invoice");
  order.rawMaterial.invoice = {
    invoiceNumber,
    amount,
    status: "PENDING",
    receivedAt: new Date().toISOString(),
    paidAt: null,
  };
  order.rawMaterial.stage = "INVOICE";
  logEvent(
    order,
    "RAW_MATERIALS",
    "INVOICE",
    `Supplier invoice ${invoiceNumber} received for $${amount}.`
  );
  return order;
}

export function payRawMaterialInvoice(order) {
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
  logEvent(
    order,
    "RAW_MATERIALS",
    "DONE",
    "Supplier invoice paid. Raw materials procurement complete."
  );
  logEvent(
    order,
    "MANUFACTURING",
    "PLACE_ORDER",
    "Raw materials received. Ready to place manufacturing order."
  );
  return order;
}

// ---------- Manufacturing, inventory & distribution ----------

function assertManufacturingStage(order, expected, label) {
  assertStage(order.manufacturing.stage, expected, label);
}

export function placeManufacturingOrder(order) {
  assertManufacturingStage(order, "PLACE_ORDER", "Placing manufacturing order");
  order.manufacturing.stage = "MODE_SELECTION";
  logEvent(
    order,
    "MANUFACTURING",
    "MODE_SELECTION",
    "Manufacturing order placed. Choosing external vendor or in-house unit."
  );
  return order;
}

export function selectManufacturingMode(order, { mode, vendorIds, unitName }) {
  assertManufacturingStage(order, "MODE_SELECTION", "Selecting manufacturing mode");
  if (mode !== "EXTERNAL" && mode !== "INHOUSE") {
    const err = new Error("mode must be EXTERNAL or INHOUSE");
    err.status = 400;
    throw err;
  }
  order.manufacturing.mode = mode;

  if (mode === "EXTERNAL") {
    if (!vendorIds || vendorIds.length === 0) {
      const err = new Error("Select at least one external vendor to send an RFQ to");
      err.status = 400;
      throw err;
    }
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
    logEvent(
      order,
      "MANUFACTURING",
      "RFQ",
      `External manufacturing selected. RFQ raised with ${order.manufacturing.rfqs
        .map((r) => r.vendorName)
        .join(", ")}.`
    );
  } else {
    order.manufacturing.vendorName = unitName || "In-house manufacturing unit";
    order.manufacturing.order = {
      id: nextId("mo"),
      vendorId: null,
      vendorName: order.manufacturing.vendorName,
      placedAt: new Date().toISOString(),
      status: "PLACED",
    };
    order.manufacturing.stage = "ORDER";
    logEvent(
      order,
      "MANUFACTURING",
      "ORDER",
      `In-house manufacturing selected at ${order.manufacturing.vendorName}. Job order placed.`
    );
  }
  return order;
}

export function quoteManufacturingRfq(order, rfqId, quotedPrice, leadTimeDays) {
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
  logEvent(
    order,
    "MANUFACTURING",
    "RFQ",
    `${rfq.vendorName} quoted $${quotedPrice} with ${leadTimeDays} day lead time.`
  );
  return order;
}

export function acceptManufacturingRfq(order, rfqId) {
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
  rfq.status = "ACCEPTED";
  order.manufacturing.rfqs
    .filter((r) => r.id !== rfqId && r.status !== "ACCEPTED")
    .forEach((r) => (r.status = "REJECTED"));
  order.manufacturing.vendorId = rfq.vendorId;
  order.manufacturing.vendorName = rfq.vendorName;
  order.manufacturing.order = {
    id: nextId("mo"),
    vendorId: rfq.vendorId,
    vendorName: rfq.vendorName,
    placedAt: new Date().toISOString(),
    status: "PLACED",
  };
  order.manufacturing.stage = "ORDER";
  logEvent(
    order,
    "MANUFACTURING",
    "ORDER",
    `Manufacturing order placed with ${rfq.vendorName} for $${rfq.quotedPrice}.`
  );
  return order;
}

export function completeManufacturingOrder(order) {
  assertManufacturingStage(order, "ORDER", "Completing manufacturing order");
  order.manufacturing.order.status = "COMPLETE";
  order.manufacturing.orderCompletedAt = new Date().toISOString();
  order.manufacturing.stage = "ORDER_COMPLETE";
  logEvent(
    order,
    "MANUFACTURING",
    "ORDER_COMPLETE",
    `Manufacturing complete at ${order.manufacturing.vendorName}.`
  );
  return order;
}

export function recordInventory(order, { producedQty, warehouseLocation }) {
  assertManufacturingStage(order, "ORDER_COMPLETE", "Recording inventory");
  order.manufacturing.inventory = {
    producedQty,
    warehouseLocation,
    stockedAt: new Date().toISOString(),
  };
  order.manufacturing.stage = "INVENTORY";
  logEvent(
    order,
    "MANUFACTURING",
    "INVENTORY",
    `${producedQty} unit(s) stocked at ${warehouseLocation}.`
  );
  return order;
}

export function recordDistribution(order, { carrier, shipmentId }) {
  assertManufacturingStage(order, "INVENTORY", "Dispatching for distribution");
  order.manufacturing.distribution = {
    carrier,
    shipmentId: shipmentId || nextId("ship"),
    dispatchedAt: new Date().toISOString(),
  };
  order.manufacturing.stage = "DISTRIBUTION";
  logEvent(
    order,
    "MANUFACTURING",
    "DISTRIBUTION",
    `Shipment ${order.manufacturing.distribution.shipmentId} dispatched via ${carrier} to move product to customer.`
  );
  return order;
}

export function recordDelivery(order, { deliveryAddress, recipient }) {
  assertManufacturingStage(order, "DISTRIBUTION", "Recording delivery");
  order.manufacturing.delivery = {
    deliveryAddress,
    recipient,
    deliveredAt: new Date().toISOString(),
  };
  order.manufacturing.stage = "DELIVERY";
  logEvent(
    order,
    "MANUFACTURING",
    "DELIVERY",
    `Product delivered to ${recipient} at ${deliveryAddress}.`
  );
  return order;
}

export function recordCustomerGoodsReceipt(order, { receivedQty, confirmedBy }) {
  assertManufacturingStage(order, "DELIVERY", "Recording customer goods receipt");
  order.manufacturing.goodsReceipt = {
    receivedQty,
    confirmedBy,
    confirmedAt: new Date().toISOString(),
  };
  order.manufacturing.stage = "GOODS_RECEIPT";
  logEvent(
    order,
    "MANUFACTURING",
    "GOODS_RECEIPT",
    `Customer confirmed receipt of ${receivedQty} unit(s).`
  );
  return order;
}

export function recordCustomerInvoice(order, { invoiceNumber, amount }) {
  assertManufacturingStage(order, "GOODS_RECEIPT", "Issuing customer invoice");
  order.manufacturing.invoice = {
    invoiceNumber,
    amount,
    status: "ISSUED",
    issuedAt: new Date().toISOString(),
    paidAt: null,
  };
  order.manufacturing.stage = "INVOICE";
  logEvent(
    order,
    "MANUFACTURING",
    "INVOICE",
    `Invoice ${invoiceNumber} issued to ${order.customerName} for $${amount}.`
  );
  return order;
}

export function recordBilling(order, { paymentStatus }) {
  assertManufacturingStage(order, "INVOICE", "Recording billing");
  order.manufacturing.invoice.status = "PAID";
  order.manufacturing.invoice.paidAt = new Date().toISOString();
  order.manufacturing.billing = {
    paymentStatus: paymentStatus || "PAID",
    billedAt: new Date().toISOString(),
  };
  order.manufacturing.stage = "BILLING";
  logEvent(
    order,
    "MANUFACTURING",
    "BILLING",
    `Billing complete, payment status: ${paymentStatus || "PAID"}.`
  );
  return order;
}

export function closeRequirementOrder(order) {
  assertManufacturingStage(order, "BILLING", "Closing the requirement order");
  order.manufacturing.stage = "DONE";
  order.phase = "CLOSED";
  order.closedAt = new Date().toISOString();
  logEvent(order, "CLOSED", "DONE", "Requirement order closed.");
  return order;
}
