// "Automatic data classification" AI opportunity: tag every record with a
// business classification derived from its attributes, with a plain-English
// rationale so the suggestion is explainable/auditable rather than a black box.
import { getRecords, updateRecord } from "../store/db.js";

const BUSINESS_KEYWORDS = /\b(inc|incorporated|llc|ltd|corp|corporation|co|company|group|district|municipal|utilities|partners|holdings|studio|studios)\b/i;

function classifyCustomer(record) {
  const isBusiness = BUSINESS_KEYWORDS.test(record.name || "");
  const accountType = isBusiness ? "Business" : "Individual";

  let tier = "SMB";
  let rationale = `Lifetime value $${record.lifetimeValue?.toLocaleString() ?? 0}`;
  if (record.lifetimeValue >= 1_000_000) tier = "Strategic";
  else if (record.lifetimeValue >= 100_000) tier = "Enterprise";
  else if (record.lifetimeValue >= 10_000) tier = "Mid-Market";
  else tier = "SMB";

  return {
    accountType,
    tier,
    rationale: `${accountType} account (${isBusiness ? "legal-entity suffix in name" : "personal name pattern"}); ${rationale} → ${tier} tier.`,
  };
}

const CRITICALITY_MAP = {
  "Industrial Equipment": "Strategic",
  "Raw Materials": "Strategic",
  Logistics: "Operational",
  "Packaging Materials": "Operational",
  Chemicals: "Operational",
  "Office Supplies": "Tactical",
};

function classifySupplier(record) {
  const criticality = CRITICALITY_MAP[record.category] ?? "Tactical";
  const missingCritical = !record.taxId || !record.addressLine1 || !record.city;
  return {
    criticality,
    riskFlag: missingCritical ? "Onboarding Incomplete" : "None",
    rationale: `Category "${record.category}" mapped to ${criticality} supply criticality.` + (missingCritical ? " Missing tax ID or address — flagged for onboarding follow-up." : ""),
  };
}

function classifyProduct(records) {
  const byCategory = new Map();
  for (const r of records) {
    if (!byCategory.has(r.category)) byCategory.set(r.category, []);
    byCategory.get(r.category).push(r);
  }
  const result = new Map();
  for (const [, group] of byCategory) {
    const prices = group.map((r) => r.unitPrice).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    for (const r of group) {
      let priceTier = "Standard";
      if (r.unitPrice > median * 3) priceTier = "Premium / Outlier";
      else if (r.unitPrice < median * 0.4) priceTier = "Budget";
      result.set(r.id, {
        priceTier,
        rationale: `Category median unit price is $${median.toFixed(2)}; this item is $${r.unitPrice.toFixed(2)} → ${priceTier}.`,
      });
    }
  }
  return result;
}

export function classifyDomain(domain) {
  const records = getRecords(domain);
  if (domain === "customers") {
    return records.map((r) => {
      const classification = classifyCustomer(r);
      updateRecord(domain, r.id, { segment: classification.tier });
      return { recordId: r.id, name: r.name, classification };
    });
  }
  if (domain === "suppliers") {
    return records.map((r) => {
      const classification = classifySupplier(r);
      updateRecord(domain, r.id, { criticality: classification.criticality });
      return { recordId: r.id, name: r.name, classification };
    });
  }
  if (domain === "products") {
    const byId = classifyProduct(records);
    return records.map((r) => {
      const classification = byId.get(r.id);
      updateRecord(domain, r.id, { priceTier: classification.priceTier });
      return { recordId: r.id, name: r.name, classification };
    });
  }
  throw new Error(`Unknown domain: ${domain}`);
}
