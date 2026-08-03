import { Router } from "express";
import {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  listContactsForAccount,
  listOpportunitiesForAccount,
  listActivitiesFor,
} from "../store/db.js";
import { INDUSTRIES } from "../data/pipeline.js";

export const accountsRouter = Router();

accountsRouter.get("/", (req, res) => {
  let results = listAccounts();
  const { q } = req.query;
  if (q) {
    const needle = String(q).toLowerCase();
    results = results.filter((a) => a.name.toLowerCase().includes(needle));
  }
  res.json(results);
});

accountsRouter.get("/meta", (req, res) => {
  res.json({ industries: INDUSTRIES });
});

accountsRouter.get("/:id", (req, res, next) => {
  try {
    const account = getAccount(req.params.id);
    res.json({
      ...account,
      contacts: listContactsForAccount(account.id),
      opportunities: listOpportunitiesForAccount(account.id),
      activities: listActivitiesFor("Account", account.id),
    });
  } catch (err) {
    next(err);
  }
});

accountsRouter.post("/", (req, res, next) => {
  try {
    if (!req.body.name) {
      const err = new Error("name is required");
      err.status = 400;
      throw err;
    }
    res.status(201).json(createAccount(req.body));
  } catch (err) {
    next(err);
  }
});

accountsRouter.put("/:id", (req, res, next) => {
  try {
    res.json(updateAccount(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});
