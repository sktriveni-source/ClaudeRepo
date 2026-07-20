import { Router } from "express";
import { db } from "../store/db.js";

export const auditRouter = Router();

auditRouter.get("/", (req, res) => {
  const sorted = [...db.auditHistory].sort((a, b) => new Date(b.changedDate) - new Date(a.changedDate));
  res.json(sorted);
});
