import { Router } from "express";
import {
  crmAccounts,
  crmContacts,
  crmLeads,
  crmOpportunities,
  crmActivities,
  crmProductCatalog,
  crmSalesTargets,
  listAudit,
} from "../store/db.js";
import { scoreLead, assessOpportunityRisk, weightedPipeline, customerSummary, nextBestActions, assistantQuery } from "../ai/crmAi.js";
import { aiEnabled } from "../ai/aiClient.js";

export const crmRouter = Router();

// ---- Dashboard / Forecast / Pipeline ----

crmRouter.get("/dashboard", (req, res) => {
  const opportunities = crmOpportunities.list();
  const open = opportunities.filter((o) => o.status === "Open");
  const won = opportunities.filter((o) => o.status === "Won");
  const target = crmSalesTargets.list((t) => t.salesPersonId === "ORG")[0];
  res.json({
    totalAccounts: crmAccounts.list().length,
    totalLeads: crmLeads.list().length,
    openOpportunities: open.length,
    totalPipeline: open.reduce((s, o) => s + o.estimatedValue, 0),
    weightedPipeline: Math.round(weightedPipeline(opportunities)),
    closedWon: won.reduce((s, o) => s + o.estimatedValue, 0),
    salesTarget: target ? target.targetAmount : 0,
    aiEnabled: aiEnabled(),
  });
});

crmRouter.get("/opportunities/pipeline", (req, res) => {
  const stages = ["Prospecting", "Qualification", "Needs Analysis", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
  const open = crmOpportunities.list((o) => o.status === "Open" || o.status === "Won");
  const byStage = stages.map((stage) => {
    const inStage = open.filter((o) => o.stage === stage);
    return { stage, value: inStage.reduce((s, o) => s + o.estimatedValue, 0), count: inStage.length };
  });
  res.json({ stages: byStage });
});

crmRouter.get("/opportunities/forecast", (req, res) => {
  const opportunities = crmOpportunities.list();
  const open = opportunities.filter((o) => o.status === "Open");
  const committed = open.filter((o) => o.probability >= 70).reduce((s, o) => s + o.estimatedValue, 0);
  const bestCase = open.reduce((s, o) => s + o.estimatedValue, 0);
  const won = opportunities.filter((o) => o.status === "Won").reduce((s, o) => s + o.estimatedValue, 0);
  const target = crmSalesTargets.list((t) => t.salesPersonId === "ORG")[0];
  res.json({
    salesTarget: target ? target.targetAmount : 0,
    totalPipeline: bestCase,
    weightedPipeline: Math.round(weightedPipeline(opportunities)),
    committed,
    bestCase,
    closedWon: won,
  });
});

// ---- Accounts ----

crmRouter.get("/accounts", (req, res) => {
  const { q, segment } = req.query;
  let items = crmAccounts.list();
  if (q) items = items.filter((a) => a.accountName.toLowerCase().includes(String(q).toLowerCase()));
  if (segment) items = items.filter((a) => a.customerSegment === segment);
  res.json(items);
});

crmRouter.post("/accounts", (req, res) => res.status(201).json(crmAccounts.create(req.body, req.body.changedBy)));

crmRouter.get("/accounts/:id", (req, res) => {
  const account = crmAccounts.get(req.params.id);
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json(account);
});

crmRouter.put("/accounts/:id", (req, res) => {
  const updated = crmAccounts.update(req.params.id, req.body, req.body.changedBy);
  if (!updated) return res.status(404).json({ error: "Account not found" });
  res.json(updated);
});

crmRouter.get("/accounts/:id/activities", (req, res) => {
  const items = crmActivities
    .list((a) => a.accountId === req.params.id)
    .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  res.json(items);
});

crmRouter.get("/accounts/:id/customer360", async (req, res) => {
  const account = crmAccounts.get(req.params.id);
  if (!account) return res.status(404).json({ error: "Account not found" });
  const opportunities = crmOpportunities.list((o) => o.accountId === account.id);
  const open = opportunities.filter((o) => o.status === "Open");
  const won = opportunities.filter((o) => o.status === "Won");
  const activities = crmActivities
    .list((a) => a.accountId === account.id)
    .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  const contacts = crmContacts.list((c) => c.accountId === account.id);
  const insight = await customerSummary(account, crmOpportunities.list(), crmActivities.list());
  res.json({
    account,
    contacts,
    openOpportunities: open,
    wonOpportunities: won,
    pipelineValue: open.reduce((s, o) => s + o.estimatedValue, 0),
    wonValue: won.reduce((s, o) => s + o.estimatedValue, 0),
    openActivitiesCount: activities.length,
    recentActivities: activities.slice(0, 8),
    aiInsight: insight.summary,
    aiInsightSource: insight.source,
  });
});

// ---- Contacts ----

crmRouter.get("/contacts", (req, res) => {
  const { accountId } = req.query;
  let items = crmContacts.list();
  if (accountId) items = items.filter((c) => c.accountId === accountId);
  res.json(items);
});

crmRouter.post("/contacts", (req, res) => res.status(201).json(crmContacts.create(req.body, req.body.changedBy)));

// ---- Leads ----

crmRouter.get("/leads", (req, res) => {
  const { status, owner } = req.query;
  let items = crmLeads.list();
  if (status) items = items.filter((l) => l.leadStatus === status);
  if (owner) items = items.filter((l) => l.owner === owner);
  res.json(items.map((l) => ({ ...l, aiScore: scoreLead(l) })));
});

crmRouter.post("/leads", (req, res) => res.status(201).json(crmLeads.create(req.body, req.body.changedBy)));

crmRouter.get("/leads/:id", (req, res) => {
  const lead = crmLeads.get(req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json({ ...lead, aiScore: scoreLead(lead) });
});

crmRouter.put("/leads/:id", (req, res) => {
  const updated = crmLeads.update(req.params.id, req.body, req.body.changedBy);
  if (!updated) return res.status(404).json({ error: "Lead not found" });
  res.json(updated);
});

crmRouter.post("/leads/:id/qualify", (req, res) => {
  const updated = crmLeads.update(req.params.id, { leadStatus: "Qualified" }, "Sales Rep");
  if (!updated) return res.status(404).json({ error: "Lead not found" });
  res.json(updated);
});

crmRouter.post("/leads/:id/convert", (req, res) => {
  const lead = crmLeads.get(req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const account = crmAccounts.create(
    {
      accountName: lead.companyName,
      industry: lead.industry,
      country: req.body.country || "Unknown",
      region: req.body.region || "Unknown",
      revenue: 0,
      employees: 0,
      accountManagerId: lead.ownerId,
      accountManager: lead.owner,
      customerSegment: "New",
      customerStatus: "Active",
    },
    lead.owner
  );
  const [firstName, ...rest] = (lead.contactName || "Unknown Contact").split(" ");
  const contact = crmContacts.create(
    {
      accountId: account.id,
      firstName: firstName || "Unknown",
      lastName: rest.join(" ") || "",
      jobTitle: "Unknown",
      email: lead.email,
      phone: "",
      department: "",
      decisionMaker: true,
    },
    lead.owner
  );
  const opportunity = crmOpportunities.create(
    {
      opportunityName: `${lead.companyName} - New Opportunity`,
      accountId: account.id,
      ownerId: lead.ownerId,
      owner: lead.owner,
      stage: "Prospecting",
      estimatedValue: req.body.estimatedValue || 50000,
      probability: 10,
      expectedCloseDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      status: "Open",
      products: [],
      competitors: [],
      decisionMakers: [contact.id],
      risks: [],
      nextAction: "Initial qualification call",
      lastActivityDate: new Date().toISOString(),
    },
    lead.owner
  );
  const updatedLead = crmLeads.update(lead.id, { leadStatus: "Converted" }, lead.owner);
  res.json({ lead: updatedLead, account, contact, opportunity });
});

// ---- Opportunities ----

crmRouter.get("/opportunities", (req, res) => {
  const { stage, accountId, owner, status } = req.query;
  let items = crmOpportunities.list();
  if (stage) items = items.filter((o) => o.stage === stage);
  if (accountId) items = items.filter((o) => o.accountId === accountId);
  if (owner) items = items.filter((o) => o.owner === owner);
  if (status) items = items.filter((o) => o.status === status);
  res.json(
    items.map((o) => ({
      ...o,
      weightedRevenue: Math.round(o.estimatedValue * (o.probability / 100)),
      risk: assessOpportunityRisk(o),
    }))
  );
});

crmRouter.post("/opportunities", (req, res) => res.status(201).json(crmOpportunities.create(req.body, req.body.changedBy)));

crmRouter.get("/opportunities/:id", (req, res) => {
  const opp = crmOpportunities.get(req.params.id);
  if (!opp) return res.status(404).json({ error: "Opportunity not found" });
  const risk = assessOpportunityRisk(opp);
  res.json({
    ...opp,
    weightedRevenue: Math.round(opp.estimatedValue * (opp.probability / 100)),
    risk,
    nextBestActions: nextBestActions(opp, risk),
    activities: crmActivities
      .list((a) => a.opportunityId === opp.id)
      .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate)),
  });
});

crmRouter.put("/opportunities/:id", (req, res) => {
  const updated = crmOpportunities.update(req.params.id, req.body, req.body.changedBy);
  if (!updated) return res.status(404).json({ error: "Opportunity not found" });
  res.json(updated);
});

// ---- Activities ----

crmRouter.get("/activities", (req, res) => {
  const { accountId, opportunityId } = req.query;
  let items = crmActivities.list();
  if (accountId) items = items.filter((a) => a.accountId === accountId);
  if (opportunityId) items = items.filter((a) => a.opportunityId === opportunityId);
  res.json(items.sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate)));
});

crmRouter.post("/activities", (req, res) => {
  const created = crmActivities.create(req.body, req.body.changedBy);
  if (created.opportunityId) {
    crmOpportunities.update(created.opportunityId, { lastActivityDate: created.activityDate }, created.owner);
  }
  res.status(201).json(created);
});

// ---- Reference data ----

crmRouter.get("/products", (req, res) => res.json(crmProductCatalog.list()));
crmRouter.get("/sales-targets", (req, res) => res.json(crmSalesTargets.list()));
crmRouter.get("/audit", (req, res) => res.json(listAudit({ entityType: req.query.entityType, entityId: req.query.entityId })));

// ---- AI ----

crmRouter.post("/ai/lead-score", (req, res) => {
  const lead = crmLeads.get(req.body.leadId);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json(scoreLead(lead));
});

crmRouter.post("/ai/opportunity-risk", (req, res) => {
  const opp = crmOpportunities.get(req.body.opportunityId);
  if (!opp) return res.status(404).json({ error: "Opportunity not found" });
  res.json(assessOpportunityRisk(opp));
});

crmRouter.post("/ai/next-best-action", (req, res) => {
  const opp = crmOpportunities.get(req.body.opportunityId);
  if (!opp) return res.status(404).json({ error: "Opportunity not found" });
  const risk = assessOpportunityRisk(opp);
  res.json({ actions: nextBestActions(opp, risk), risk });
});

crmRouter.post("/ai/customer-summary", async (req, res) => {
  const account = crmAccounts.get(req.body.accountId);
  if (!account) return res.status(404).json({ error: "Account not found" });
  const result = await customerSummary(account, crmOpportunities.list(), crmActivities.list());
  res.json(result);
});

crmRouter.post("/ai/query", async (req, res) => {
  const { question, owner } = req.body;
  if (!question) return res.status(400).json({ error: "question is required" });
  const result = await assistantQuery(question, {
    opportunities: crmOpportunities.list(),
    accounts: crmAccounts.list(),
    activities: crmActivities.list(),
    owner,
  });
  res.json(result);
});
