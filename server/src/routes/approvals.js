import { Router } from "express";
import { listApprovals } from "../store/db.js";

export const approvalsRouter = Router();

approvalsRouter.get("/", (req, res) => {
  res.json(listApprovals(req.query.status));
});
