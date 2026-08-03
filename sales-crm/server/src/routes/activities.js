import { Router } from "express";
import { logActivity, listActivitiesFor } from "../store/db.js";
import { ACTIVITY_TYPES } from "../data/pipeline.js";

export const activitiesRouter = Router();

activitiesRouter.get("/meta", (req, res) => {
  res.json({ types: ACTIVITY_TYPES });
});

activitiesRouter.get("/", (req, res, next) => {
  try {
    const { relatedType, relatedId } = req.query;
    if (!relatedType || !relatedId) {
      const err = new Error("relatedType and relatedId query params are required");
      err.status = 400;
      throw err;
    }
    res.json(listActivitiesFor(relatedType, relatedId));
  } catch (err) {
    next(err);
  }
});

activitiesRouter.post("/", (req, res, next) => {
  try {
    const { relatedType, relatedId, type, subject } = req.body;
    if (!relatedType || !relatedId || !type || !subject) {
      const err = new Error("relatedType, relatedId, type and subject are required");
      err.status = 400;
      throw err;
    }
    res.status(201).json(logActivity(req.body));
  } catch (err) {
    next(err);
  }
});
