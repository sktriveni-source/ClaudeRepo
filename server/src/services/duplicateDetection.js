import { getRecords, getDataSource, setDuplicateClusters, nextClusterId } from "../store/db.js";
import {
  nameSimilarity,
  normalizeTaxId,
  normalizeEmail,
  normalizePhone,
  normalizeAddress,
} from "../utils/similarity.js";

// Domain-specific "AI matching model" configuration. In a production system
// this would be a learned model; here it's a transparent weighted-field
// scorer so the reasoning behind every match is explainable in the UI.
const DOMAIN_CONFIG = {
  suppliers: {
    threshold: 0.72,
    fields: [
      { key: "name", weight: 0.35, compare: (a, b) => nameSimilarity(a.name, b.name) },
      { key: "taxId", weight: 0.35, compare: (a, b) => exactMatch(normalizeTaxId(a.taxId), normalizeTaxId(b.taxId)) },
      { key: "address", weight: 0.2, compare: (a, b) => addressSimilarity(a, b) },
      { key: "email", weight: 0.1, compare: (a, b) => exactMatch(normalizeEmail(a.email), normalizeEmail(b.email)) },
    ],
  },
  customers: {
    threshold: 0.7,
    fields: [
      { key: "name", weight: 0.3, compare: (a, b) => nameSimilarity(a.name, b.name) },
      { key: "email", weight: 0.4, compare: (a, b) => exactMatch(normalizeEmail(a.email), normalizeEmail(b.email)) },
      { key: "phone", weight: 0.2, compare: (a, b) => exactMatch(normalizePhone(a.phone), normalizePhone(b.phone)) },
      { key: "address", weight: 0.1, compare: (a, b) => addressSimilarity(a, b) },
    ],
  },
  products: {
    threshold: 0.72,
    fields: [
      { key: "sku", weight: 0.5, compare: (a, b) => exactMatch(a.sku, b.sku) },
      { key: "name", weight: 0.35, compare: (a, b) => nameSimilarity(a.name, b.name) },
      { key: "category", weight: 0.15, compare: (a, b) => exactMatch(String(a.category || "").toLowerCase(), String(b.category || "").toLowerCase()) },
    ],
  },
};

function exactMatch(a, b) {
  if (!a || !b) return 0;
  return a === b ? 1 : 0;
}

function addressSimilarity(a, b) {
  const na = normalizeAddress([a.addressLine1, a.city, a.state, a.postalCode].filter(Boolean).join(" "));
  const nb = normalizeAddress([b.addressLine1, b.city, b.state, b.postalCode].filter(Boolean).join(" "));
  if (!na || !nb) return 0;
  return nameSimilarity(na, nb);
}

function completenessScore(record) {
  const values = Object.values(record);
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "").length;
  return nonNull / values.length;
}

function scorePair(domain, a, b) {
  const cfg = DOMAIN_CONFIG[domain];
  const matched = [];
  let score = 0;
  for (const f of cfg.fields) {
    const s = f.compare(a, b);
    score += s * f.weight;
    if (s >= 0.85) matched.push(f.key);
  }
  return { score: +score.toFixed(3), matched };
}

class UnionFind {
  constructor(ids) {
    this.parent = new Map(ids.map((id) => [id, id]));
  }
  find(x) {
    if (this.parent.get(x) !== x) this.parent.set(x, this.find(this.parent.get(x)));
    return this.parent.get(x);
  }
  union(x, y) {
    const rx = this.find(x);
    const ry = this.find(y);
    if (rx !== ry) this.parent.set(rx, ry);
  }
}

export function detectDuplicates(domain) {
  const cfg = DOMAIN_CONFIG[domain];
  if (!cfg) throw new Error(`Unknown domain: ${domain}`);
  const records = getRecords(domain);

  const pairMatches = [];
  const uf = new UnionFind(records.map((r) => r.id));

  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const { score, matched } = scorePair(domain, records[i], records[j]);
      if (score >= cfg.threshold) {
        pairMatches.push({ a: records[i].id, b: records[j].id, score, matched });
        uf.union(records[i].id, records[j].id);
      }
    }
  }

  const groups = new Map();
  for (const r of records) {
    const root = uf.find(r.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(r.id);
  }

  const clusters = [];
  for (const memberIds of groups.values()) {
    if (memberIds.length < 2) continue;
    const members = memberIds.map((id) => records.find((r) => r.id === id));
    const relatedMatches = pairMatches.filter((m) => memberIds.includes(m.a) && memberIds.includes(m.b));
    const avgScore = relatedMatches.reduce((s, m) => s + m.score, 0) / relatedMatches.length;
    const matchedFields = [...new Set(relatedMatches.flatMap((m) => m.matched))];

    const golden = [...members].sort((a, b) => {
      const c = completenessScore(b) - completenessScore(a);
      if (c !== 0) return c;
      return new Date(b.createdAt) - new Date(a.createdAt);
    })[0];

    clusters.push({
      id: nextClusterId(),
      domain,
      status: "open",
      confidence: +avgScore.toFixed(3),
      matchedFields,
      suggestedGoldenRecordId: golden.id,
      members: members.map((m) => ({
        ...m,
        sourceName: getDataSource(m.sourceId)?.name ?? m.sourceId,
        completeness: +completenessScore(m).toFixed(2),
      })),
      explanation: buildExplanation(domain, matchedFields, avgScore),
    });
  }

  clusters.sort((a, b) => b.confidence - a.confidence);
  setDuplicateClusters(domain, clusters);
  return clusters;
}

function buildExplanation(domain, matchedFields, score) {
  const label = domain.slice(0, -1);
  const confidence = score >= 0.9 ? "very high" : score >= 0.8 ? "high" : "moderate";
  const fieldList = matchedFields.length ? matchedFields.join(", ") : "overall attribute similarity";
  return `${confidence} confidence duplicate ${label} — matched on ${fieldList}.`;
}
