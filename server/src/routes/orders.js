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

// ---- Raw material procurement ----

ordersRouter.post(
  "/:id/raw-material/place",
  handle((req, res) => {
    res.json(db.placeRawMaterialOrder(loadOrder(req)));
  })
);

ordersRouter.post(
  "/:id/raw-material/sourcing",
  handle((req, res) => {
    res.json(db.sourceRawMaterialVendors(loadOrder(req), req.body?.vendorIds));
  })
);

ordersRouter.post(
  "/:id/raw-material/rfq/:rfqId/quote",
  handle((req, res) => {
    const { quotedPrice, leadTimeDays } = req.body || {};
    res.json(
      db.quoteRawMaterialRfq(loadOrder(req), req.params.rfqId, quotedPrice, leadTimeDays)
    );
  })
);

ordersRouter.post(
  "/:id/raw-material/rfq/:rfqId/accept",
  handle((req, res) => {
    res.json(db.acceptRawMaterialRfq(loadOrder(req), req.params.rfqId));
  })
);

ordersRouter.post(
  "/:id/raw-material/goods-receipt",
  handle((req, res) => {
    res.json(db.recordRawMaterialGoodsReceipt(loadOrder(req), req.body || {}));
  })
);

ordersRouter.post(
  "/:id/raw-material/invoice",
  handle((req, res) => {
    res.json(db.recordRawMaterialInvoice(loadOrder(req), req.body || {}));
  })
);

ordersRouter.post(
  "/:id/raw-material/invoice/pay",
  handle((req, res) => {
    res.json(db.payRawMaterialInvoice(loadOrder(req)));
  })
);

// ---- Manufacturing, inventory & distribution ----

ordersRouter.post(
  "/:id/manufacturing/place",
  handle((req, res) => {
    res.json(db.placeManufacturingOrder(loadOrder(req)));
  })
);

ordersRouter.post(
  "/:id/manufacturing/mode",
  handle((req, res) => {
    res.json(db.selectManufacturingMode(loadOrder(req), req.body || {}));
  })
);

ordersRouter.post(
  "/:id/manufacturing/rfq/:rfqId/quote",
  handle((req, res) => {
    const { quotedPrice, leadTimeDays } = req.body || {};
    res.json(
      db.quoteManufacturingRfq(loadOrder(req), req.params.rfqId, quotedPrice, leadTimeDays)
    );
  })
);

ordersRouter.post(
  "/:id/manufacturing/rfq/:rfqId/accept",
  handle((req, res) => {
    res.json(db.acceptManufacturingRfq(loadOrder(req), req.params.rfqId));
  })
);

ordersRouter.post(
  "/:id/manufacturing/order/complete",
  handle((req, res) => {
    res.json(db.completeManufacturingOrder(loadOrder(req)));
  })
);

ordersRouter.post(
  "/:id/manufacturing/inventory",
  handle((req, res) => {
    res.json(db.recordInventory(loadOrder(req), req.body || {}));
  })
);

ordersRouter.post(
  "/:id/manufacturing/distribution",
  handle((req, res) => {
    res.json(db.recordDistribution(loadOrder(req), req.body || {}));
  })
);

ordersRouter.post(
  "/:id/manufacturing/delivery",
  handle((req, res) => {
    res.json(db.recordDelivery(loadOrder(req), req.body || {}));
  })
);

ordersRouter.post(
  "/:id/manufacturing/goods-receipt",
  handle((req, res) => {
    res.json(db.recordCustomerGoodsReceipt(loadOrder(req), req.body || {}));
  })
);

ordersRouter.post(
  "/:id/manufacturing/invoice",
  handle((req, res) => {
    res.json(db.recordCustomerInvoice(loadOrder(req), req.body || {}));
  })
);

ordersRouter.post(
  "/:id/manufacturing/billing",
  handle((req, res) => {
    res.json(db.recordBilling(loadOrder(req), req.body || {}));
  })
);

ordersRouter.post(
  "/:id/close",
  handle((req, res) => {
    res.json(db.closeRequirementOrder(loadOrder(req)));
  })
);
