import { Router } from "express";
import {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  changeOpportunityStage,
  getAccount,
  getContact,
  listActivitiesFor,
} from "../store/db.js";
import { OPPORTUNITY_STAGES } from "../data/pipeline.js";

export const opportunitiesRouter = Router();

opportunitiesRouter.get("/", (req, res) => {
  let results = listOpportunities();
  const { stage, owner, accountId, q } = req.query;
  if (stage) results = results.filter((o) => o.stage === stage);
  if (owner) results = results.filter((o) => o.owner === owner);
  if (accountId) results = results.filter((o) => o.accountId === accountId);
  if (q) {
    const needle = String(q).toLowerCase();
    results = results.filter((o) => o.name.toLowerCase().includes(needle));
  }
  res.json(results);
});

opportunitiesRouter.get("/meta", (req, res) => {
  res.json({ stages: OPPORTUNITY_STAGES });
});

opportunitiesRouter.get("/:id", (req, res, next) => {
  try {
    const opportunity = getOpportunity(req.params.id);
    res.json({
      ...opportunity,
      account: opportunity.accountId ? getAccount(opportunity.accountId) : null,
      contact: opportunity.contactId ? getContact(opportunity.contactId) : null,
      activities: listActivitiesFor("Opportunity", opportunity.id),
    });
  } catch (err) {
    next(err);
  }
});

opportunitiesRouter.post("/", (req, res, next) => {
  try {
    if (!req.body.name || !req.body.accountId) {
      const err = new Error("name and accountId are required");
      err.status = 400;
      throw err;
    }
    res.status(201).json(createOpportunity(req.body));
  } catch (err) {
    next(err);
  }
});

opportunitiesRouter.put("/:id", (req, res, next) => {
  try {
    res.json(updateOpportunity(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

opportunitiesRouter.post("/:id/stage", (req, res, next) => {
  try {
    const { stage, owner, note, amount } = req.body;
    res.json(changeOpportunityStage(req.params.id, stage, { owner, note, amount }));
  } catch (err) {
    next(err);
  }
});
