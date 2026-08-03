import { nextId } from "../utils/id.js";
import {
  LEAD_STATUSES,
  OPPORTUNITY_STAGES,
  opportunityStageMeta,
  leadStatusMeta,
} from "../data/pipeline.js";

// Central in-memory data store. No external database is required — this
// mirrors the pattern used by the rest of this repo's demo apps. All
// records are plain objects keyed by id inside Maps so lookups are O(1).
const leads = new Map();
const accounts = new Map();
const contacts = new Map();
const opportunities = new Map();
const activities = new Map();

function now() {
  return new Date().toISOString();
}

function assertExists(map, id, label) {
  const record = map.get(id);
  if (!record) {
    const err = new Error(`${label} ${id} not found`);
    err.status = 404;
    throw err;
  }
  return record;
}

// ---------------------------------------------------------------------------
// Activities / sales transaction log
// ---------------------------------------------------------------------------

export function logActivity({ relatedType, relatedId, type, subject, description, owner, meta }) {
  const activity = {
    id: nextId("ACT"),
    relatedType,
    relatedId,
    type,
    subject,
    description: description || "",
    owner: owner || "System",
    meta: meta || {},
    createdAt: now(),
  };
  activities.set(activity.id, activity);
  return activity;
}

export function listActivitiesFor(relatedType, relatedId) {
  return [...activities.values()]
    .filter((a) => a.relatedType === relatedType && a.relatedId === relatedId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllActivities(limit = 25) {
  return [...activities.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export function createAccount(data) {
  const account = {
    id: nextId("ACC"),
    name: data.name,
    industry: data.industry || "Technology",
    website: data.website || "",
    phone: data.phone || "",
    billingCity: data.billingCity || "",
    billingCountry: data.billingCountry || "",
    owner: data.owner || "Unassigned",
    createdAt: now(),
    updatedAt: now(),
  };
  accounts.set(account.id, account);
  logActivity({
    relatedType: "Account",
    relatedId: account.id,
    type: "Note",
    subject: "Account created",
    owner: account.owner,
  });
  return account;
}

export function updateAccount(id, patch) {
  const account = assertExists(accounts, id, "Account");
  Object.assign(account, patch, { updatedAt: now() });
  return account;
}

export function listAccounts() {
  return [...accounts.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAccount(id) {
  return assertExists(accounts, id, "Account");
}

export function findAccountByName(name) {
  const normalized = name.trim().toLowerCase();
  return [...accounts.values()].find((a) => a.name.trim().toLowerCase() === normalized);
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export function createContact(data) {
  const contact = {
    id: nextId("CON"),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email || "",
    phone: data.phone || "",
    title: data.title || "",
    accountId: data.accountId || null,
    leadSource: data.leadSource || "",
    owner: data.owner || "Unassigned",
    createdAt: now(),
    updatedAt: now(),
  };
  contacts.set(contact.id, contact);
  logActivity({
    relatedType: "Contact",
    relatedId: contact.id,
    type: "Note",
    subject: "Contact created",
    owner: contact.owner,
  });
  return contact;
}

export function updateContact(id, patch) {
  const contact = assertExists(contacts, id, "Contact");
  Object.assign(contact, patch, { updatedAt: now() });
  return contact;
}

export function listContacts() {
  return [...contacts.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getContact(id) {
  return assertExists(contacts, id, "Contact");
}

export function listContactsForAccount(accountId) {
  return [...contacts.values()].filter((c) => c.accountId === accountId);
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export function createLead(data) {
  const lead = {
    id: nextId("LEAD"),
    firstName: data.firstName,
    lastName: data.lastName,
    company: data.company,
    title: data.title || "",
    email: data.email || "",
    phone: data.phone || "",
    source: data.source || "Web",
    status: "New",
    rating: data.rating || "Warm",
    owner: data.owner || "Unassigned",
    notes: data.notes || "",
    convertedAccountId: null,
    convertedContactId: null,
    convertedOpportunityId: null,
    createdAt: now(),
    updatedAt: now(),
  };
  leads.set(lead.id, lead);
  logActivity({
    relatedType: "Lead",
    relatedId: lead.id,
    type: "StatusChange",
    subject: "Lead captured",
    description: `New lead engaged via ${lead.source}`,
    owner: lead.owner,
    meta: { toStatus: "New" },
  });
  return lead;
}

export function updateLead(id, patch) {
  const lead = assertExists(leads, id, "Lead");
  Object.assign(lead, patch, { updatedAt: now() });
  return lead;
}

export function listLeads() {
  return [...leads.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getLead(id) {
  return assertExists(leads, id, "Lead");
}

const LEAD_TRANSITIONS = {
  New: ["Nurturing", "Converted", "Disqualified"],
  Nurturing: ["New", "Converted", "Disqualified"],
  Converted: [],
  Disqualified: ["New"],
};

export function changeLeadStatus(id, toStatus, { owner, note } = {}) {
  const lead = assertExists(leads, id, "Lead");
  if (!leadStatusMeta(toStatus)) {
    const err = new Error(`Unknown lead status ${toStatus}`);
    err.status = 400;
    throw err;
  }
  const allowed = LEAD_TRANSITIONS[lead.status] || [];
  if (lead.status !== toStatus && !allowed.includes(toStatus)) {
    const err = new Error(`Cannot move lead from ${lead.status} to ${toStatus}`);
    err.status = 400;
    throw err;
  }
  const fromStatus = lead.status;
  lead.status = toStatus;
  lead.updatedAt = now();
  logActivity({
    relatedType: "Lead",
    relatedId: lead.id,
    type: "StatusChange",
    subject: `Status changed: ${fromStatus} → ${toStatus}`,
    description: note || "",
    owner: owner || lead.owner,
    meta: { fromStatus, toStatus },
  });
  return lead;
}

/**
 * Converts a qualified lead into an Account + Contact + Opportunity,
 * mirroring Salesforce's lead conversion flow. Reuses an existing account
 * when one already matches the lead's company name.
 */
export function convertLead(id, options = {}) {
  const lead = assertExists(leads, id, "Lead");
  if (lead.status === "Converted") {
    const err = new Error("Lead is already converted");
    err.status = 400;
    throw err;
  }

  let account = options.existingAccountId ? getAccount(options.existingAccountId) : findAccountByName(lead.company);
  if (!account) {
    account = createAccount({
      name: lead.company,
      owner: options.owner || lead.owner,
      industry: options.industry,
    });
  }

  const contact = createContact({
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    title: lead.title,
    accountId: account.id,
    leadSource: lead.source,
    owner: options.owner || lead.owner,
  });

  const opportunity = createOpportunity({
    name: options.opportunityName || `${account.name} – ${lead.title || "New Business"}`,
    accountId: account.id,
    contactId: contact.id,
    amount: options.amount || 0,
    closeDate: options.closeDate || null,
    owner: options.owner || lead.owner,
    stage: "Opportunity",
    sourceLeadId: lead.id,
  });

  lead.status = "Converted";
  lead.convertedAccountId = account.id;
  lead.convertedContactId = contact.id;
  lead.convertedOpportunityId = opportunity.id;
  lead.updatedAt = now();

  logActivity({
    relatedType: "Lead",
    relatedId: lead.id,
    type: "Conversion",
    subject: "Lead converted",
    description: `Converted into Account ${account.name}, Contact ${contact.firstName} ${contact.lastName}, Opportunity ${opportunity.name}`,
    owner: options.owner || lead.owner,
    meta: { accountId: account.id, contactId: contact.id, opportunityId: opportunity.id },
  });

  return { lead, account, contact, opportunity };
}

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

export function createOpportunity(data) {
  const stage = data.stage || "Opportunity";
  const meta = opportunityStageMeta(stage);
  if (!meta) {
    const err = new Error(`Unknown opportunity stage ${stage}`);
    err.status = 400;
    throw err;
  }
  const opportunity = {
    id: nextId("OPP"),
    name: data.name,
    accountId: data.accountId,
    contactId: data.contactId || null,
    amount: Number(data.amount) || 0,
    currency: data.currency || "USD",
    stage,
    probability: meta.probability,
    closeDate: data.closeDate || null,
    owner: data.owner || "Unassigned",
    sourceLeadId: data.sourceLeadId || null,
    createdAt: now(),
    updatedAt: now(),
  };
  opportunities.set(opportunity.id, opportunity);
  logActivity({
    relatedType: "Opportunity",
    relatedId: opportunity.id,
    type: "StageChange",
    subject: `Opportunity created at stage ${stage}`,
    owner: opportunity.owner,
    meta: { toStage: stage, amount: opportunity.amount },
  });
  return opportunity;
}

export function updateOpportunity(id, patch) {
  const opportunity = assertExists(opportunities, id, "Opportunity");
  Object.assign(opportunity, patch, { updatedAt: now() });
  return opportunity;
}

export function listOpportunities() {
  return [...opportunities.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOpportunity(id) {
  return assertExists(opportunities, id, "Opportunity");
}

export function listOpportunitiesForAccount(accountId) {
  return [...opportunities.values()].filter((o) => o.accountId === accountId);
}

export function listOpportunitiesForContact(contactId) {
  return [...opportunities.values()].filter((o) => o.contactId === contactId);
}

const STAGE_ORDER = OPPORTUNITY_STAGES.map((s) => s.key);

export function changeOpportunityStage(id, toStage, { owner, note, amount } = {}) {
  const opportunity = assertExists(opportunities, id, "Opportunity");
  const meta = opportunityStageMeta(toStage);
  if (!meta) {
    const err = new Error(`Unknown opportunity stage ${toStage}`);
    err.status = 400;
    throw err;
  }
  const currentMeta = opportunityStageMeta(opportunity.stage);
  if (currentMeta.terminal) {
    const err = new Error(`Opportunity is already closed (${opportunity.stage})`);
    err.status = 400;
    throw err;
  }

  const fromStage = opportunity.stage;
  opportunity.stage = toStage;
  opportunity.probability = meta.probability;
  if (amount !== undefined) opportunity.amount = Number(amount) || opportunity.amount;
  opportunity.updatedAt = now();

  logActivity({
    relatedType: "Opportunity",
    relatedId: opportunity.id,
    type: "StageChange",
    subject: `Stage changed: ${fromStage} → ${toStage}`,
    description: note || "",
    owner: owner || opportunity.owner,
    meta: { fromStage, toStage, amount: opportunity.amount },
  });

  return opportunity;
}

export function nextStageFor(stage) {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

// ---------------------------------------------------------------------------
// Dashboard aggregation
// ---------------------------------------------------------------------------

export function getDashboardSummary() {
  const allLeads = [...leads.values()];
  const allOpps = [...opportunities.values()];

  const openLeadCount = allLeads.filter((l) => l.status === "New" || l.status === "Nurturing").length;
  const stageCounts = {
    Lead: allLeads.filter((l) => l.status === "New").length,
    Nurturing: allLeads.filter((l) => l.status === "Nurturing").length,
  };
  for (const stage of OPPORTUNITY_STAGES) {
    const key = stage.won === false ? "ClosedLost" : stage.terminal ? "Closure" : stage.key;
    const count = allOpps.filter((o) => o.stage === stage.key).length;
    stageCounts[key] = (stageCounts[key] || 0) + count;
  }

  const openOpps = allOpps.filter((o) => !opportunityStageMeta(o.stage).terminal);
  const wonOpps = allOpps.filter((o) => o.stage === "Closed Won");
  const lostOpps = allOpps.filter((o) => o.stage === "Closed Lost");
  const pipelineValue = openOpps.reduce((sum, o) => sum + o.amount, 0);
  const weightedPipelineValue = openOpps.reduce((sum, o) => sum + o.amount * (o.probability / 100), 0);
  const wonValue = wonOpps.reduce((sum, o) => sum + o.amount, 0);
  const closedCount = wonOpps.length + lostOpps.length;
  const winRate = closedCount === 0 ? 0 : Math.round((wonOpps.length / closedCount) * 100);
  const leadConversionRate =
    allLeads.length === 0 ? 0 : Math.round((allLeads.filter((l) => l.status === "Converted").length / allLeads.length) * 100);

  return {
    totals: {
      leads: allLeads.length,
      openLeads: openLeadCount,
      accounts: accounts.size,
      contacts: contacts.size,
      opportunities: allOpps.length,
      openOpportunities: openOpps.length,
      pipelineValue,
      weightedPipelineValue: Math.round(weightedPipelineValue),
      wonValue,
      winRate,
      leadConversionRate,
    },
    stageCounts,
    recentActivity: listAllActivities(10),
  };
}

export { LEAD_STATUSES, OPPORTUNITY_STAGES };
