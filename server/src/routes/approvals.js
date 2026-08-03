import { Router } from "express";
import * as db from "../store/db.js";
import { isValidStage } from "../data/stages.js";

export const approvalsRouter = Router();

function actorOf(req) {
  return (req.body && req.body.actor) || req.query.actor || "Unknown user";
}

approvalsRouter.get("/", (req, res) => {
  const { status, productId } = req.query;
  res.json(db.listStageRequests({ status, productId }));
});

approvalsRouter.post("/", (req, res) => {
  const { productId, toStage, comment } = req.body;
  const requestedBy = actorOf(req);

  const product = db.getProduct(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  if (!isValidStage(toStage)) {
    return res.status(400).json({ error: "Invalid target stage" });
  }
  if (toStage === product.lifecycleStage) {
    return res.status(400).json({ error: "Product is already in that stage" });
  }
  if (db.hasPendingRequest(productId)) {
    return res.status(409).json({ error: "A stage-change request is already pending for this product" });
  }

  const request = db.createStageRequest(product, toStage, requestedBy, comment);
  res.status(201).json(request);
});

function requireApproverRole(req, res) {
  if (req.body.role !== "Approver") {
    res.status(403).json({ error: "Only a user acting as Approver can decide this request" });
    return false;
  }
  return true;
}

approvalsRouter.post("/:id/approve", (req, res) => {
  if (!requireApproverRole(req, res)) return;
  const approver = actorOf(req);
  const request = db.decideStageRequest(req.params.id, true, approver, req.body.comment);
  if (!request) return res.status(404).json({ error: "Pending request not found" });
  res.json(request);
});

approvalsRouter.post("/:id/reject", (req, res) => {
  if (!requireApproverRole(req, res)) return;
  const approver = actorOf(req);
  const request = db.decideStageRequest(req.params.id, false, approver, req.body.comment);
  if (!request) return res.status(404).json({ error: "Pending request not found" });
  res.json(request);
});
