import { Router } from "express";
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  getAccount,
  listOpportunitiesForContact,
  listActivitiesFor,
} from "../store/db.js";

export const contactsRouter = Router();

contactsRouter.get("/", (req, res) => {
  let results = listContacts();
  const { accountId, q } = req.query;
  if (accountId) results = results.filter((c) => c.accountId === accountId);
  if (q) {
    const needle = String(q).toLowerCase();
    results = results.filter((c) =>
      [c.firstName, c.lastName, c.email].filter(Boolean).some((v) => v.toLowerCase().includes(needle))
    );
  }
  res.json(results);
});

contactsRouter.get("/:id", (req, res, next) => {
  try {
    const contact = getContact(req.params.id);
    const account = contact.accountId ? getAccount(contact.accountId) : null;
    res.json({
      ...contact,
      account,
      opportunities: listOpportunitiesForContact(contact.id),
      activities: listActivitiesFor("Contact", contact.id),
    });
  } catch (err) {
    next(err);
  }
});

contactsRouter.post("/", (req, res, next) => {
  try {
    if (!req.body.firstName || !req.body.lastName) {
      const err = new Error("firstName and lastName are required");
      err.status = 400;
      throw err;
    }
    res.status(201).json(createContact(req.body));
  } catch (err) {
    next(err);
  }
});

contactsRouter.put("/:id", (req, res, next) => {
  try {
    res.json(updateContact(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});
