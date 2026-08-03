import { Router } from "express";
import { getDashboardStats } from "../store/db.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", (req, res) => {
  res.json(getDashboardStats());
});
