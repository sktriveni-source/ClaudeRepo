import { Router } from "express";
import { getDashboardSummary } from "../store/db.js";
import { PIPELINE_STEPS, OWNERS } from "../data/pipeline.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", (req, res) => {
  res.json({ ...getDashboardSummary(), pipelineSteps: PIPELINE_STEPS });
});

dashboardRouter.get("/owners", (req, res) => {
  res.json(OWNERS);
});
