import { Router } from "express";
import { db, nextId } from "../store/db.js";

export const salesTargetsRouter = Router();

salesTargetsRouter.get("/", (req, res) => {
  let list = db.salesTargets;
  const { salesPersonId, period } = req.query;
  if (salesPersonId) list = list.filter((t) => t.salesPersonId === salesPersonId);
  if (period) list = list.filter((t) => t.period === period);
  res.json(list);
});

salesTargetsRouter.post("/", (req, res) => {
  const target = {
    targetId: nextId("ST"),
    salesPersonId: req.body.salesPersonId,
    period: req.body.period,
    targetAmount: Number(req.body.targetAmount) || 0,
  };
  db.salesTargets.push(target);
  res.status(201).json(target);
});
