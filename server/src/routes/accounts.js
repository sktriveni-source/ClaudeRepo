import { Router } from "express";
import { db, nextId, recordAudit, userName } from "../store/db.js";
import { customerSummary } from "../services/aiService.js";

export const accountsRouter = Router();

function withComputed(account) {
  return { ...account, accountManagerName: userName(account.accountManagerId) };
}

accountsRouter.get("/", (req, res) => {
  let list = db.accounts;
  const { region, industry, segment, status, q } = req.query;
  if (region) list = list.filter((a) => a.region === region);
  if (industry) list = list.filter((a) => a.industry === industry);
  if (segment) list = list.filter((a) => a.customerSegment === segment);
  if (status) list = list.filter((a) => a.customerStatus === status);
  if (q) {
    const term = q.toLowerCase();
    list = list.filter((a) => a.accountName.toLowerCase().includes(term));
  }
  res.json(list.map(withComputed));
});

accountsRouter.get("/:id", (req, res) => {
  const account = db.accounts.find((a) => a.accountId === req.params.id);
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json(withComputed(account));
});

accountsRouter.post("/", (req, res) => {
  const account = {
    accountId: nextId("A"),
    accountName: req.body.accountName,
    industry: req.body.industry || "",
    country: req.body.country || "",
    region: req.body.region || "",
    revenue: Number(req.body.revenue) || 0,
    employees: Number(req.body.employees) || 0,
    accountManagerId: req.body.accountManagerId || "",
    customerSegment: req.body.customerSegment || "Mid-Market",
    customerStatus: req.body.customerStatus || "Prospect",
  };
  db.accounts.push(account);
  recordAudit({ entityType: "Account", entityId: account.accountId, action: "Create", newValue: account.accountName, changedBy: req.body.changedBy });
  res.status(201).json(withComputed(account));
});

accountsRouter.put("/:id", (req, res) => {
  const account = db.accounts.find((a) => a.accountId === req.params.id);
  if (!account) return res.status(404).json({ error: "Account not found" });
  const before = { ...account };
  Object.assign(account, req.body, { accountId: account.accountId });
  recordAudit({
    entityType: "Account",
    entityId: account.accountId,
    action: "Update",
    oldValue: JSON.stringify(before),
    newValue: JSON.stringify(account),
    changedBy: req.body.changedBy,
  });
  res.json(withComputed(account));
});

accountsRouter.get("/:id/customer360", (req, res) => {
  const account = db.accounts.find((a) => a.accountId === req.params.id);
  if (!account) return res.status(404).json({ error: "Account not found" });

  const acctContacts = db.contacts.filter((c) => c.accountId === account.accountId);
  const acctOpportunities = db.opportunities.filter((o) => o.accountId === account.accountId);
  const acctActivities = db.activities
    .filter((a) => a.accountId === account.accountId)
    .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  const productIds = new Set(
    acctOpportunities.filter((o) => o.status === "Closed Won").flatMap((o) => o.products || [])
  );
  const productsPurchased = db.products.filter((p) => productIds.has(p.productId));

  const summary = customerSummary(account);

  res.json({
    account: withComputed(account),
    contacts: acctContacts,
    opportunities: acctOpportunities,
    activities: acctActivities,
    productsPurchased,
    documents: [],
    openSupportIssues: [],
    aiSummary: summary,
  });
});

accountsRouter.get("/:id/activities", (req, res) => {
  const acctActivities = db.activities
    .filter((a) => a.accountId === req.params.id)
    .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  res.json(acctActivities);
});
