import { createCollection, nextId, listAudit } from "./collection.js";
import {
  productSeed,
  documentSeed,
  changeRequestSeed,
} from "../data/plmSeed.js";
import {
  sourceSeed,
  recordSeed,
  ruleSeed,
  issueOverrides,
} from "../data/mdmSeed.js";
import {
  accountSeed,
  contactSeed,
  leadSeed,
  opportunitySeed,
  activitySeed,
  productCatalogSeed,
  salesTargetSeed,
} from "../data/crmSeed.js";

// ---- PLM ----
export const plmProducts = createCollection("PLMProduct", "PRD", productSeed);
export const plmDocuments = createCollection("PLMDocument", "DOC", documentSeed);
export const plmChangeRequests = createCollection("PLMChangeRequest", "CR", changeRequestSeed);

// ---- MDM ----
export const mdmSources = createCollection("MDMSource", "SRC", sourceSeed);
export const mdmRecords = createCollection("MDMRecord", "REC", recordSeed);
export const mdmRules = createCollection("MDMRule", "RUL", ruleSeed);

function qualityScoreFor(record) {
  const fieldCount = Object.keys(record.attributes || {}).length || 1;
  const missing = Object.values(record.attributes || {}).filter(
    (v) => v === null || v === undefined || v === "" || v === "not set"
  ).length;
  const completeness = 1 - missing / fieldCount;
  const penalty = (record.issues || []).length * 0.12;
  const score = Math.max(0, Math.min(1, completeness - penalty));
  return Math.round(score * 100);
}

// Derive an issue-tracking record per data-quality problem found on a master
// record, seeded with sensible workflow defaults and any manual overrides.
export const mdmIssues = createCollection("MDMIssue", "ISS", []);
for (const record of mdmRecords.list()) {
  for (const type of record.issues || []) {
    const override = issueOverrides[record.id] || {};
    const descriptions = {
      DUPLICATE: `Potential duplicate of another ${record.entityType.toLowerCase()} record with matching contact/tax details.`,
      INCOMPLETE: `${record.entityType} record is missing one or more required attributes.`,
      CONFLICT: `Conflicting attribute values found across systems (e.g. shared Tax ID with another account).`,
      FORMAT: `Attribute values do not conform to the expected format standard.`,
    };
    const severities = { DUPLICATE: "High", INCOMPLETE: "Medium", CONFLICT: "Critical", FORMAT: "Low" };
    mdmIssues.create({
      recordId: record.id,
      entityType: record.entityType,
      type,
      description: descriptions[type] || "Data quality issue detected.",
      status: override.status || "Open",
      severity: severities[type] || "Medium",
      assignedTo: override.assignedTo || null,
    });
  }
}

// ---- CRM ----
export const crmAccounts = createCollection("CRMAccount", "ACC", accountSeed);
export const crmContacts = createCollection("CRMContact", "CON", contactSeed);
export const crmLeads = createCollection("CRMLead", "LEA", leadSeed);
export const crmOpportunities = createCollection("CRMOpportunity", "OPP", opportunitySeed);
export const crmActivities = createCollection("CRMActivity", "ACT", activitySeed);
export const crmProductCatalog = createCollection("CRMProduct", "PRO", productCatalogSeed);
export const crmSalesTargets = createCollection("CRMSalesTarget", "TGT", salesTargetSeed);

// ---- AI insight cache (AIInsight entity from the spec) ----
export const aiInsights = createCollection("AIInsight", "INS", []);

export function saveInsight({ entityType, entityId, insightType, insight, confidenceScore }) {
  return aiInsights.create({ entityType, entityId, insightType, insight, confidenceScore });
}

export { listAudit, nextId };
