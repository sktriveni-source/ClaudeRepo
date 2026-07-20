import { Router } from "express";
import { db, nextId, recordAudit, userName } from "../store/db.js";
import { scoreLead } from "../services/aiService.js";

export const leadsRouter = Router();

function withScore(lead) {
  const scoring = scoreLead(lead);
  return {
    ...lead,
    ownerName: userName(lead.ownerId),
    aiScore: scoring.score,
    aiRecommendation: scoring.recommendation,
    aiReasons: scoring.reasons,
  };
}

leadsRouter.get("/", (req, res) => {
  let list = db.leads;
  const { status, ownerId, source, q } = req.query;
  if (status) list = list.filter((l) => l.leadStatus === status);
  if (ownerId) list = list.filter((l) => l.ownerId === ownerId);
  if (source) list = list.filter((l) => l.leadSource === source);
  if (q) {
    const term = q.toLowerCase();
    list = list.filter((l) => l.companyName.toLowerCase().includes(term) || l.contactName.toLowerCase().includes(term));
  }
  res.json(list.map(withScore));
});

leadsRouter.get("/:id", (req, res) => {
  const lead = db.leads.find((l) => l.leadId === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json(withScore(lead));
});

leadsRouter.post("/", (req, res) => {
  const lead = {
    leadId: nextId("L"),
    companyName: req.body.companyName,
    contactName: req.body.contactName,
    email: req.body.email || "",
    leadSource: req.body.leadSource || "Website",
    leadStatus: "New",
    ownerId: req.body.ownerId || "",
    createdDate: new Date().toISOString().slice(0, 10),
    industry: req.body.industry || "",
    companySize: Number(req.body.companySize) || 0,
    engagementScore: Number(req.body.engagementScore) || 20,
  };
  db.leads.push(lead);
  recordAudit({ entityType: "Lead", entityId: lead.leadId, action: "Create", newValue: lead.companyName });
  res.status(201).json(withScore(lead));
});

leadsRouter.put("/:id", (req, res) => {
  const lead = db.leads.find((l) => l.leadId === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  const before = lead.leadStatus;
  Object.assign(lead, req.body, { leadId: lead.leadId });
  if (before !== lead.leadStatus) {
    recordAudit({ entityType: "Lead", entityId: lead.leadId, action: "Update", oldValue: `Status: ${before}`, newValue: `Status: ${lead.leadStatus}` });
  }
  res.json(withScore(lead));
});

leadsRouter.post("/:id/qualify", (req, res) => {
  const lead = db.leads.find((l) => l.leadId === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  const before = lead.leadStatus;
  lead.leadStatus = req.body.qualified === false ? "Disqualified" : "Qualified";
  recordAudit({ entityType: "Lead", entityId: lead.leadId, action: "Qualify", oldValue: `Status: ${before}`, newValue: `Status: ${lead.leadStatus}` });
  res.json(withScore(lead));
});

leadsRouter.post("/:id/convert", (req, res) => {
  const lead = db.leads.find((l) => l.leadId === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  if (lead.leadStatus === "Converted") {
    return res.status(400).json({ error: "Lead already converted" });
  }

  let account = db.accounts.find((a) => a.accountName.toLowerCase() === lead.companyName.toLowerCase());
  if (!account) {
    account = {
      accountId: nextId("A"),
      accountName: lead.companyName,
      industry: lead.industry,
      country: "",
      region: "",
      revenue: 0,
      employees: lead.companySize,
      accountManagerId: lead.ownerId,
      customerSegment: lead.companySize > 1000 ? "Enterprise" : "Mid-Market",
      customerStatus: "Prospect",
    };
    db.accounts.push(account);
  }

  const [firstName, ...rest] = lead.contactName.split(" ");
  const contact = {
    contactId: nextId("C"),
    accountId: account.accountId,
    firstName: firstName || lead.contactName,
    lastName: rest.join(" ") || "",
    jobTitle: "",
    email: lead.email,
    phone: "",
    department: "",
    decisionMakingRole: "Unknown",
  };
  db.contacts.push(contact);

  const opportunity = {
    opportunityId: nextId("O"),
    accountId: account.accountId,
    opportunityName: `${lead.companyName} - New Opportunity`,
    ownerId: lead.ownerId,
    stage: "Prospecting",
    estimatedValue: req.body.estimatedValue ? Number(req.body.estimatedValue) : 0,
    probability: 10,
    expectedCloseDate: req.body.expectedCloseDate || "",
    status: "Open",
    products: [],
    competitors: [],
    decisionMakers: [],
    risks: [],
    nextAction: "Qualify budget and timeline",
  };
  db.opportunities.push(opportunity);

  lead.leadStatus = "Converted";
  recordAudit({ entityType: "Lead", entityId: lead.leadId, action: "Convert", oldValue: "Status: Qualified", newValue: "Status: Converted" });

  res.json({ lead: withScore(lead), account, contact, opportunity });
});
