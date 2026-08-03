import { Router } from "express";
import {
  listLeads,
  getLead,
  createLead,
  updateLead,
  changeLeadStatus,
  convertLead,
  listActivitiesFor,
} from "../store/db.js";
import { LEAD_SOURCES } from "../data/pipeline.js";

export const leadsRouter = Router();

leadsRouter.get("/", (req, res) => {
  let results = listLeads();
  const { status, owner, q } = req.query;
  if (status) results = results.filter((l) => l.status === status);
  if (owner) results = results.filter((l) => l.owner === owner);
  if (q) {
    const needle = String(q).toLowerCase();
    results = results.filter((l) =>
      [l.firstName, l.lastName, l.company, l.email].filter(Boolean).some((v) => v.toLowerCase().includes(needle))
    );
  }
  res.json(results);
});

leadsRouter.get("/meta", (req, res) => {
  res.json({ sources: LEAD_SOURCES });
});

leadsRouter.get("/:id", (req, res, next) => {
  try {
    const lead = getLead(req.params.id);
    res.json({ ...lead, activities: listActivitiesFor("Lead", lead.id) });
  } catch (err) {
    next(err);
  }
});

leadsRouter.post("/", (req, res, next) => {
  try {
    if (!req.body.firstName || !req.body.lastName || !req.body.company) {
      const err = new Error("firstName, lastName and company are required");
      err.status = 400;
      throw err;
    }
    res.status(201).json(createLead(req.body));
  } catch (err) {
    next(err);
  }
});

leadsRouter.put("/:id", (req, res, next) => {
  try {
    res.json(updateLead(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

leadsRouter.post("/:id/status", (req, res, next) => {
  try {
    const { status, owner, note } = req.body;
    res.json(changeLeadStatus(req.params.id, status, { owner, note }));
  } catch (err) {
    next(err);
  }
});

leadsRouter.post("/:id/convert", (req, res, next) => {
  try {
    const result = convertLead(req.params.id, req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
});
