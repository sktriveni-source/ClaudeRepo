import { Router } from "express";
import * as db from "../store/db.js";

export const ordersRouter = Router();

function handle(fn) {
  return (req, res) => {
    try {
      fn(req, res);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || "Internal server error" });
    }
  };
}

function loadOrder(req) {
  const order = db.getOrder(req.params.id);
  if (!order) {
    const err = new Error("Requirement order not found");
    err.status = 404;
    throw err;
  }
  return order;
}

function actorOf(req) {
  return (req.body && req.body.actor) || "Unknown";
}

ordersRouter.get(
  "/",
  handle((req, res) => {
    res.json(db.listOrders());
  })
);

ordersRouter.post(
  "/",
  handle((req, res) => {
    const { customerName, customerEmail, productName, quantity, specifications, materials } =
      req.body || {};
    if (!customerName || !productName || !quantity) {
      return res
        .status(400)
        .json({ error: "customerName, productName and quantity are required" });
    }
    const order = db.createOrder({
      customerName,
      customerEmail,
      productName,
      quantity,
      specifications,
      materials,
    });
    res.status(201).json(order);
  })
);

ordersRouter.get(
  "/:id",
  handle((req, res) => {
    res.json(loadOrder(req));
  })
);

// ---- Approvals (order-scoped) ----

ordersRouter.get(
  "/:id/approvals",
  handle((req, res) => {
    res.json(loadOrder(req).approvals);
  })
);

ordersRouter.post(
  "/:id/approvals/:approvalId/decide",
  handle((req, res) => {
    const { decision, decidedBy, comments } = req.body || {};
    res.json(db.decideApproval(loadOrder(req), req.params.approvalId, { decision, decidedBy, comments }));
  })
);

// ---- Raw material procurement ----

ordersRouter.post(
  "/:id/raw-material/place",
  handle((req, res) => {
    res.json(db.placeRawMaterialOrder(loadOrder(req), actorOf(req)));
  })
);

ordersRouter.post(
  "/:id/raw-material/sourcing",
  handle((req, res) => {
    res.json(db.sourceRawMaterialVendors(loadOrder(req), req.body?.vendorIds, actorOf(req)));
  })
);

ordersRouter.post(
  "/:id/raw-material/rfq/:rfqId/quote",
  handle((req, res) => {
    const { quotedPrice, leadTimeDays } = req.body || {};
    res.json(
      db.quoteRawMaterialRfq(loadOrder(req), req.params.rfqId, quotedPrice, leadTimeDays, actorOf(req))
    );
  })
);

ordersRouter.post(
  "/:id/raw-material/rfq/:rfqId/accept",
  handle((req, res) => {
    const { requestedBy } = req.body || {};
    res.json(db.submitAcceptRawMaterialRfq(loadOrder(req), req.params.rfqId, requestedBy));
  })
);

ordersRouter.post(
  "/:id/raw-material/order/place",
  handle((req, res) => {
    const { requestedBy } = req.body || {};
    res.json(db.submitPlaceRawMaterialOrder(loadOrder(req), requestedBy));
  })
);

ordersRouter.post(
  "/:id/raw-material/goods-receipt",
  handle((req, res) => {
    const { requestedBy, ...data } = req.body || {};
    res.json(db.submitRawMaterialGoodsReceipt(loadOrder(req), data, requestedBy));
  })
);

ordersRouter.post(
  "/:id/raw-material/invoice",
  handle((req, res) => {
    const { requestedBy, ...data } = req.body || {};
    res.json(db.submitRawMaterialInvoice(loadOrder(req), data, requestedBy));
  })
);

ordersRouter.post(
  "/:id/raw-material/invoice/pay",
  handle((req, res) => {
    res.json(db.payRawMaterialInvoice(loadOrder(req), actorOf(req)));
  })
);

// ---- Manufacturing, inventory & distribution ----

ordersRouter.post(
  "/:id/manufacturing/place",
  handle((req, res) => {
    res.json(db.placeManufacturingOrder(loadOrder(req), actorOf(req)));
  })
);

ordersRouter.post(
  "/:id/manufacturing/mode",
  handle((req, res) => {
    const { actor, ...data } = req.body || {};
    res.json(db.selectManufacturingMode(loadOrder(req), data, actor || data.requestedBy));
  })
);

ordersRouter.post(
  "/:id/manufacturing/rfq/:rfqId/quote",
  handle((req, res) => {
    const { quotedPrice, leadTimeDays } = req.body || {};
    res.json(
      db.quoteManufacturingRfq(loadOrder(req), req.params.rfqId, quotedPrice, leadTimeDays, actorOf(req))
    );
  })
);

ordersRouter.post(
  "/:id/manufacturing/rfq/:rfqId/accept",
  handle((req, res) => {
    const { requestedBy } = req.body || {};
    res.json(db.submitAcceptManufacturingRfq(loadOrder(req), req.params.rfqId, requestedBy));
  })
);

ordersRouter.post(
  "/:id/manufacturing/order/place",
  handle((req, res) => {
    const { requestedBy } = req.body || {};
    res.json(db.submitPlaceManufacturingOrder(loadOrder(req), requestedBy));
  })
);

ordersRouter.post(
  "/:id/manufacturing/order/complete",
  handle((req, res) => {
    res.json(db.completeManufacturingOrder(loadOrder(req), actorOf(req)));
  })
);

ordersRouter.post(
  "/:id/manufacturing/inventory",
  handle((req, res) => {
    const { requestedBy, ...data } = req.body || {};
    res.json(db.submitInventory(loadOrder(req), data, requestedBy));
  })
);

ordersRouter.post(
  "/:id/manufacturing/distribution",
  handle((req, res) => {
    const { requestedBy, ...data } = req.body || {};
    res.json(db.submitDistribution(loadOrder(req), data, requestedBy));
  })
);

ordersRouter.post(
  "/:id/manufacturing/delivery",
  handle((req, res) => {
    const { requestedBy, ...data } = req.body || {};
    res.json(db.submitDelivery(loadOrder(req), data, requestedBy));
  })
);

ordersRouter.post(
  "/:id/manufacturing/goods-receipt",
  handle((req, res) => {
    const { requestedBy, ...data } = req.body || {};
    res.json(db.submitManufacturingGoodsReceipt(loadOrder(req), data, requestedBy));
  })
);

ordersRouter.post(
  "/:id/manufacturing/invoice",
  handle((req, res) => {
    const { requestedBy, ...data } = req.body || {};
    res.json(db.submitManufacturingInvoice(loadOrder(req), data, requestedBy));
  })
);

ordersRouter.post(
  "/:id/manufacturing/billing",
  handle((req, res) => {
    const { requestedBy, ...data } = req.body || {};
    res.json(db.submitBilling(loadOrder(req), data, requestedBy));
  })
);

ordersRouter.post(
  "/:id/close",
  handle((req, res) => {
    res.json(db.closeRequirementOrder(loadOrder(req), actorOf(req)));
  })
);
