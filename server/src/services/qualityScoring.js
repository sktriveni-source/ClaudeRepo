import { getRecords, getIssues, getDuplicateClusters, getDataSource, DOMAINS } from "../store/db.js";
import { profileDomain } from "./profiling.js";

const HIDDEN_FIELDS = new Set(["id", "sourceId", "sourceRecordId"]);
const SEVERITY_PENALTY = { critical: 1, high: 0.75, medium: 0.5, low: 0.25 };
const PATTERN_FIELDS = ["phone", "taxId", "email"];

const WEIGHTS = { completeness: 0.3, validity: 0.3, uniqueness: 0.25, consistency: 0.15 };

function recordCompleteness(record) {
  const entries = Object.entries(record).filter(([k]) => !HIDDEN_FIELDS.has(k));
  const nonNull = entries.filter(([, v]) => v !== null && v !== undefined && v !== "").length;
  return nonNull / entries.length;
}

function dominantPatternMap(domain) {
  const profile = profileDomain(domain);
  const map = {};
  for (const f of profile.fields) {
    if (PATTERN_FIELDS.includes(f.field)) map[f.field] = f.patterns[0]?.pattern ?? null;
  }
  return map;
}

function classifySame(field, value, dominant) {
  const v = String(value);
  if (field === "phone") {
    if (/^\(\d{3}\) \d{3}-\d{4}$/.test(v)) return "(NNN) NNN-NNNN" === dominant;
    if (/^\d{3}-\d{3}-\d{4}$/.test(v)) return "NNN-NNN-NNNN" === dominant;
    if (/^\d{3}\.\d{3}\.\d{4}$/.test(v)) return "NNN.NNN.NNNN" === dominant;
    return dominant === "other";
  }
  if (field === "taxId") {
    if (/^\d{2}-\d{7}$/.test(v)) return "NN-NNNNNNN" === dominant;
    if (/^\d{9}$/.test(v)) return "NNNNNNNNN" === dominant;
    return dominant === "other";
  }
  if (field === "email") {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    return valid ? dominant === "valid-email" : dominant === "invalid-email";
  }
  return true;
}

function recordConsistency(record, patternMap) {
  const applicable = PATTERN_FIELDS.filter((f) => record[f] !== null && record[f] !== undefined && record[f] !== "" && patternMap[f]);
  if (applicable.length === 0) return 1;
  const matches = applicable.filter((f) => classifySame(f, record[f], patternMap[f])).length;
  return matches / applicable.length;
}

function recordValidity(recordId, validityIssues) {
  const issues = validityIssues.filter((i) => i.recordId === recordId);
  if (issues.length === 0) return 1;
  const penalty = Math.min(1, issues.reduce((s, i) => s + (SEVERITY_PENALTY[i.severity] ?? 0.5), 0));
  return 1 - penalty;
}

function recordUniqueness(recordId, clusters) {
  const cluster = clusters.find((c) => c.members.some((m) => m.id === recordId));
  if (!cluster) return 1;
  return Math.max(0, 1 - cluster.confidence);
}

export function scoreRecords(domain) {
  const records = getRecords(domain);
  const validityIssues = getIssues({ domain, category: "validity" });
  const clusters = getDuplicateClusters(domain);
  const patternMap = dominantPatternMap(domain);

  return records.map((r) => {
    const completeness = recordCompleteness(r);
    const validity = recordValidity(r.id, validityIssues);
    const uniqueness = recordUniqueness(r.id, clusters);
    const consistency = recordConsistency(r, patternMap);
    const overall = completeness * WEIGHTS.completeness + validity * WEIGHTS.validity + uniqueness * WEIGHTS.uniqueness + consistency * WEIGHTS.consistency;
    return { recordId: r.id, sourceId: r.sourceId, name: r.name || r.sku, completeness, validity, uniqueness, consistency, overall };
  });
}

export function scoreDomain(domain) {
  const perRecord = scoreRecords(domain);

  const avg = (key) => (perRecord.length ? perRecord.reduce((s, r) => s + r[key], 0) / perRecord.length : 1);

  const dimensions = {
    completeness: +avg("completeness").toFixed(3),
    validity: +avg("validity").toFixed(3),
    uniqueness: +avg("uniqueness").toFixed(3),
    consistency: +avg("consistency").toFixed(3),
  };
  const overall = Math.round(avg("overall") * 100);

  const bySource = {};
  for (const r of perRecord) {
    if (!bySource[r.sourceId]) bySource[r.sourceId] = [];
    bySource[r.sourceId].push(r.overall);
  }
  const sourceScores = Object.entries(bySource).map(([sourceId, scores]) => ({
    sourceId,
    sourceName: getDataSource(sourceId)?.name ?? sourceId,
    score: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100),
  }));

  const lowestRecords = [...perRecord].sort((a, b) => a.overall - b.overall).slice(0, 5).map((r) => ({ ...r, overall: Math.round(r.overall * 100) }));

  return { domain, overall, dimensions, sourceScores, lowestRecords, recordCount: perRecord.length };
}

export function scoreAllDomains() {
  const domainScores = DOMAINS.map(scoreDomain);
  const totalRecords = domainScores.reduce((s, d) => s + d.recordCount, 0);
  const overall = totalRecords
    ? Math.round(domainScores.reduce((s, d) => s + d.overall * d.recordCount, 0) / totalRecords)
    : 100;
  return { overall, domains: domainScores };
}
