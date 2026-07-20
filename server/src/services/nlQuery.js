// "AI opportunity: natural-language rule creation / querying" — the example
// in the brief is: "Find suppliers with incomplete address information and
// duplicate tax IDs." We parse that into a structured query plan (entity +
// AND-ed conditions) and execute it against the record store, the same way
// an LLM-backed NL-to-SQL layer would, but with a transparent, inspectable
// rule set instead of an opaque model call.
import { getRecords, getDataSource, getDuplicateClusters } from "../store/db.js";
import { detectDuplicates } from "./duplicateDetection.js";
import { detectAnomalies } from "./anomalyDetection.js";
import { scoreRecords } from "./qualityScoring.js";

const DOMAIN_ALIASES = [
  { domain: "suppliers", pattern: /\bsuppliers?\b|\bvendors?\b/i },
  { domain: "customers", pattern: /\bcustomers?\b|\bclients?\b|\baccounts?\b/i },
  { domain: "products", pattern: /\bproducts?\b|\bitems?\b|\bskus?\b/i },
];

const ADDRESS_FIELDS = ["addressLine1", "city", "state", "postalCode"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ensureDuplicates(domain) {
  const existing = getDuplicateClusters(domain);
  return existing && existing.length ? existing : detectDuplicates(domain);
}

function findCluster(domain, recordId) {
  return ensureDuplicates(domain).find((c) => c.members.some((m) => m.id === recordId));
}

const CONDITION_MATCHERS = [
  {
    key: "incompleteAddress",
    label: "incomplete address information",
    test: (q) => /incomplete address|missing address|no address|address (is |are )?(incomplete|missing)/i.test(q),
    applicable: (domain) => domain !== "products",
    evaluate: (domain, r) => {
      const missing = ADDRESS_FIELDS.filter((f) => !r[f]);
      return missing.length > 0 ? { match: true, reason: `Missing ${missing.join(", ")}` } : { match: false };
    },
  },
  {
    key: "duplicateTaxId",
    label: "duplicate tax IDs",
    test: (q) => /duplicate tax id|duplicate tax ids|same tax id|shared tax id/i.test(q),
    applicable: (domain) => domain === "suppliers",
    evaluate: (domain, r) => {
      const cluster = findCluster(domain, r.id);
      if (!cluster || !cluster.matchedFields.includes("taxId")) return { match: false };
      const others = cluster.members.filter((m) => m.id !== r.id).map((m) => `${m.name} (${getDataSource(m.sourceId)?.name})`);
      return { match: true, reason: `Tax ID ${r.taxId} shared with ${others.join("; ")}` };
    },
  },
  {
    key: "invalidEmail",
    label: "invalid email format",
    test: (q) => /invalid email/i.test(q),
    applicable: () => true,
    evaluate: (domain, r) => {
      if (!r.email) return { match: false };
      return EMAIL_RE.test(r.email) ? { match: false } : { match: true, reason: `Email "${r.email}" fails format validation` };
    },
  },
  {
    key: "missingEmail",
    label: "missing email address",
    test: (q) => /missing email|no email|without (an )?email/i.test(q),
    applicable: () => true,
    evaluate: (domain, r) => (!r.email ? { match: true, reason: "Email is blank" } : { match: false }),
  },
  {
    key: "missingPhone",
    label: "missing phone number",
    test: (q) => /missing phone|no phone|without (a )?phone/i.test(q),
    applicable: () => true,
    evaluate: (domain, r) => (!r.phone ? { match: true, reason: "Phone is blank" } : { match: false }),
  },
  {
    key: "missingCategory",
    label: "missing category",
    test: (q) => /missing categor|no categor|uncategorized/i.test(q),
    applicable: (domain) => domain === "products" || domain === "suppliers",
    evaluate: (domain, r) => (!r.category ? { match: true, reason: "Category is blank" } : { match: false }),
  },
  {
    key: "priceAnomaly",
    label: "an unusual / outlier price",
    test: (q) => /price (anomaly|outlier|is unusual)|unusual price|outlier price/i.test(q),
    applicable: (domain) => domain === "products",
    evaluate: (domain, r, ctx) => {
      const found = ctx.anomalies.find((a) => a.recordId === r.id);
      return found ? { match: true, reason: found.description } : { match: false };
    },
  },
  {
    key: "lowQualityScore",
    label: "a low data-quality score",
    test: (q) => /low (data )?quality|poor quality|quality score below/i.test(q),
    applicable: () => true,
    evaluate: (domain, r, ctx) => {
      const thresholdMatch = ctx.query.match(/below (\d+)/i);
      const threshold = thresholdMatch ? Number(thresholdMatch[1]) : 70;
      const entry = ctx.scores.find((s) => s.recordId === r.id);
      const overall = Math.round((entry?.overall ?? 1) * 100);
      return overall < threshold ? { match: true, reason: `Quality score ${overall} is below ${threshold}` } : { match: false };
    },
  },
  {
    key: "anyDuplicate",
    label: "flagged as a likely duplicate",
    test: (q) => /\bduplicate(s)?\b/i.test(q),
    applicable: () => true,
    evaluate: (domain, r) => {
      const cluster = findCluster(domain, r.id);
      return cluster ? { match: true, reason: `${cluster.explanation}` } : { match: false };
    },
  },
];

export function interpretQuery(query) {
  const domainMatch = DOMAIN_ALIASES.find((d) => d.pattern.test(query));
  const domain = domainMatch?.domain ?? null;

  const seen = new Set();
  const conditions = [];
  for (const matcher of CONDITION_MATCHERS) {
    if (seen.has(matcher.key)) continue;
    if (matcher.key === "anyDuplicate" && conditions.some((c) => c.key === "duplicateTaxId")) continue; // more specific match wins
    if (matcher.test(query) && (!domain || matcher.applicable(domain))) {
      conditions.push(matcher);
      seen.add(matcher.key);
    }
  }
  return { domain, conditions };
}

export function runNaturalLanguageQuery(query) {
  const { domain, conditions } = interpretQuery(query);

  if (!domain) {
    return {
      query,
      understood: false,
      message: 'Could not identify whether this is about suppliers, customers, or products. Try starting with "Find suppliers with..." / "customers with..." / "products with...".',
    };
  }
  if (conditions.length === 0) {
    return {
      query,
      understood: false,
      domain,
      message: `Identified entity "${domain}" but no recognized condition (try phrases like "incomplete address", "duplicate tax IDs", "missing email", "price anomaly", "low quality score").`,
    };
  }

  const records = getRecords(domain);
  const ctx = { query, anomalies: domain === "products" ? detectAnomalies("products") : [], scores: scoreRecords(domain) };

  const results = [];
  for (const r of records) {
    const reasons = [];
    let matchesAll = true;
    for (const c of conditions) {
      const { match, reason } = c.evaluate(domain, r, ctx);
      if (!match) {
        matchesAll = false;
        break;
      }
      reasons.push(reason);
    }
    if (matchesAll) {
      results.push({
        ...r,
        sourceName: getDataSource(r.sourceId)?.name ?? r.sourceId,
        matchReasons: reasons,
      });
    }
  }

  return {
    query,
    understood: true,
    domain,
    interpretedAs: `${domain} WHERE ${conditions.map((c) => c.label).join(" AND ")}`,
    conditions: conditions.map((c) => c.label),
    matchCount: results.length,
    results,
  };
}
