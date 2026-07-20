// "AI opportunity: cleansing suggestions" — given an open issue, propose a
// concrete fix. Kept rule-based and transparent (no black-box rewriting of
// enterprise data) but structured so a human just has to accept/reject.
import { getRecord } from "../store/db.js";
import { profileDomain } from "./profiling.js";

const CANONICAL_UNITS = { each: "EA", ea: "EA", pcs: "EA", roll: "ROLL", case: "CASE", yard: "YD", yd: "YD", gal: "GAL", pail: "PAIL" };

function titleCase(str) {
  return str.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
}

export function suggestFix(issue) {
  const record = getRecord(issue.domain, issue.recordId);
  if (!record) return { action: "review", suggestion: "Record no longer exists — dismiss issue." };

  if (issue.category === "completeness") {
    return {
      action: "enrich",
      suggestion: `"${issue.field}" is missing on ${record.name || record.sku}. Route to the owning source system (${record.sourceId}) for enrichment, or backfill from a matching golden record if one exists in another source.`,
    };
  }

  if (issue.category === "anomaly") {
    return {
      action: "review",
      suggestion: `Flag "${issue.field}" = ${record[issue.field]} for manual review against the ${issue.domain.slice(0, -1)} owner before it propagates downstream.`,
    };
  }

  if (issue.category === "validity") {
    if (issue.field === "taxId") {
      const digits = String(record.taxId || "").replace(/\D/g, "");
      if (digits.length === 9) {
        const formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
        return { action: "auto-fix", suggestion: `Reformat tax ID to standard EIN format.`, suggestedValue: formatted, field: "taxId" };
      }
      return { action: "review", suggestion: `Tax ID "${record.taxId}" is malformed or too short — request a corrected W-9 from the supplier.` };
    }
    if (issue.field === "email") {
      return { action: "review", suggestion: `Email "${record.email}" fails format validation — likely missing "@". Confirm the correct address with the account contact before overwriting.` };
    }
    if (issue.field === "category") {
      const profile = profileDomain(issue.domain);
      const canonical = profile.fields.find((f) => f.field === "category");
      const guess = titleCase(String(record.category || "").trim());
      return { action: "auto-fix", suggestion: `Normalize category casing to the standard taxonomy.`, suggestedValue: guess, field: "category" };
    }
    if (issue.field === "unit") {
      const key = String(record.unit || "").toLowerCase();
      const canonical = CANONICAL_UNITS[key];
      if (canonical) return { action: "auto-fix", suggestion: `Normalize unit of measure to canonical code.`, suggestedValue: canonical, field: "unit" };
    }
    if (issue.field === "paymentTermsDays") {
      return { action: "review", suggestion: `Payment terms of ${record.paymentTermsDays} days is outside policy — confirm with procurement before adjusting the contract term.` };
    }
    return { action: "review", suggestion: `"${issue.field}" value does not pass validation — needs manual correction.` };
  }

  return { action: "review", suggestion: "No automated suggestion available — route to a data steward." };
}

export function suggestPhoneStandardization(domain) {
  const profile = profileDomain(domain);
  const phoneField = profile.fields.find((f) => f.field === "phone");
  if (!phoneField || phoneField.patterns.length <= 1) return null;
  const dominant = phoneField.patterns[0].pattern;
  return {
    field: "phone",
    dominantFormat: dominant,
    variants: phoneField.patterns.slice(1),
    suggestion: `${phoneField.patterns.length} phone formats detected across ${domain}. Standardize all records to "${dominant}".`,
  };
}
