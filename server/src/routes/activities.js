import { Router } from "express";
import { db, nextId, userName } from "../store/db.js";

export const activitiesRouter = Router();

function withComputed(a) {
  const account = db.accounts.find((acc) => acc.accountId === a.accountId);
  const opp = db.opportunities.find((o) => o.opportunityId === a.opportunityId);
  return {
    ...a,
    ownerName: userName(a.ownerId),
    accountName: account?.accountName || "",
    opportunityName: opp?.opportunityName || null,
  };
}

activitiesRouter.get("/", (req, res) => {
  let list = db.activities;
  const { accountId, opportunityId, ownerId, type, q } = req.query;
  if (accountId) list = list.filter((a) => a.accountId === accountId);
  if (opportunityId) list = list.filter((a) => a.opportunityId === opportunityId);
  if (ownerId) list = list.filter((a) => a.ownerId === ownerId);
  if (type) list = list.filter((a) => a.activityType === type);
  if (q) {
    const term = q.toLowerCase();
    list = list.filter((a) => a.subject.toLowerCase().includes(term));
  }
  const sorted = [...list].sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  res.json(sorted.map(withComputed));
});

activitiesRouter.post("/", (req, res) => {
  const activity = {
    activityId: nextId("AC"),
    accountId: req.body.accountId,
    opportunityId: req.body.opportunityId || null,
    activityType: req.body.activityType || "Task",
    subject: req.body.subject,
    description: req.body.description || "",
    activityDate: req.body.activityDate || new Date().toISOString().slice(0, 10),
    ownerId: req.body.ownerId || "",
  };
  db.activities.push(activity);
  res.status(201).json(withComputed(activity));
});
