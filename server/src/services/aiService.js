import { UNRESOLVED_CR_STATUSES, LIFECYCLE_LABELS, COMPLIANCE_LABELS } from "../data/constants.js";

const STOPWORDS = new Set([
  "a", "an", "the", "of", "for", "and", "or", "with", "to", "in", "on", "is", "are",
  "show", "list", "find", "me", "please", "what", "which", "any", "all", "that", "have",
  "has", "unresolved", "open", "products", "product", "documents", "document",
]);

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function significantTokens(text) {
  return tokenize(text).filter((w) => !STOPWORDS.has(w));
}

function daysBetween(a, b) {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function isApproachingEol(product, horizonDays = 180) {
  if (!product.eolDate) return false;
  const eol = new Date(product.eolDate);
  const now = new Date();
  const diff = daysBetween(now, eol);
  return diff <= horizonDays; // includes already-past-EOL as "approaching or reached"
}

function unresolvedCRsFor(productId, changeRequests) {
  return changeRequests.filter(
    (cr) => cr.productId === productId && UNRESOLVED_CR_STATUSES.includes(cr.status)
  );
}

// ---------- 1. RAG-style natural language query answering ----------
export function answerQuery(question, ctx) {
  const { products, documents, changeRequests } = ctx;
  const q = String(question || "").toLowerCase();

  const mentionsEol = /(end[\s-]?of[\s-]?life|eol|sunset|retir(e|ing|ement))/.test(q);
  const mentionsUnresolvedCR = /(unresolved|open|pending|outstanding).{0,20}(change request|ecr)/.test(q) ||
    /(change request|ecr).{0,20}(unresolved|open|pending|outstanding)/.test(q);
  const mentionsNonCompliant = /(non[\s-]?compliant|compliance issue|fail(ed|ing)? complian)/.test(q);
  const mentionsDuplicates = /(duplicate|near[\s-]?duplicate|overlap(ping)?)/.test(q);
  const mentionsDataQuality = /(data quality|missing (owner|description|data)|incomplete)/.test(q);
  const mentionsAudit = /(audit|history|who changed|log)/.test(q);

  const categoryMatch = ["electronics", "mechanical", "software", "packaging", "chemical"].find((c) =>
    q.includes(c)
  );

  if (mentionsDuplicates) {
    const dupes = detectDuplicates(products).slice(0, 5);
    return {
      answer: dupes.length
        ? `Found ${dupes.length} potential duplicate product pair(s) based on name, description, and category similarity.`
        : "No likely duplicate products were found above the similarity threshold.",
      products: [],
      documents: [],
      changeRequests: [],
      duplicates: dupes,
    };
  }

  if (mentionsDataQuality) {
    const issues = dataQualityReport(ctx).slice(0, 8);
    return {
      answer: issues.length
        ? `Found ${issues.length} data quality issue(s) across the product catalog.`
        : "No data quality issues detected.",
      products: [],
      documents: [],
      changeRequests: [],
      qualityIssues: issues,
    };
  }

  if (mentionsAudit) {
    return {
      answer: "Audit history is available on each product's Audit tab, or the full Audit Log page for a chronological view across all entities.",
      products: [],
      documents: [],
      changeRequests: [],
    };
  }

  // Structured filter path: EOL + unresolved CRs is the flagship example query.
  if (mentionsEol || mentionsUnresolvedCR || mentionsNonCompliant || categoryMatch) {
    let matches = products;
    if (mentionsEol) matches = matches.filter((p) => isApproachingEol(p));
    if (mentionsNonCompliant) matches = matches.filter((p) => p.complianceStatus === "non_compliant");
    if (categoryMatch) matches = matches.filter((p) => p.category.toLowerCase() === categoryMatch);

    let matchedCRs = [];
    if (mentionsUnresolvedCR) {
      matches = matches.filter((p) => unresolvedCRsFor(p.id, changeRequests).length > 0);
      matchedCRs = matches.flatMap((p) => unresolvedCRsFor(p.id, changeRequests));
    }

    const parts = [];
    if (mentionsEol) parts.push("approaching end-of-life");
    if (mentionsNonCompliant) parts.push("marked non-compliant");
    if (categoryMatch) parts.push(`in the ${categoryMatch} category`);
    if (mentionsUnresolvedCR) parts.push("with unresolved change requests");

    return {
      answer: matches.length
        ? `Found ${matches.length} product(s) ${parts.join(", ")}.`
        : `No products matched: ${parts.join(", ")}.`,
      products: matches,
      documents: [],
      changeRequests: matchedCRs,
    };
  }

  // Fallback: free-text retrieval across products and documents (RAG-style
  // keyword overlap scoring, since there's no vector index in this demo).
  const terms = significantTokens(q);
  if (terms.length === 0) {
    return {
      answer:
        "Ask about product lifecycle status, end-of-life timing, change requests, compliance, duplicates, or data quality — for example: \"Show products approaching end-of-life with unresolved change requests.\"",
      products: [],
      documents: [],
      changeRequests: [],
    };
  }

  const scoredProducts = products
    .map((p) => {
      const haystack = significantTokens(
        `${p.name} ${p.code} ${p.description} ${p.category} ${(p.tags || []).join(" ")}`
      );
      const score = terms.filter((t) => haystack.includes(t)).length;
      return { p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => r.p);

  const scoredDocs = documents
    .map((d) => {
      const haystack = significantTokens(`${d.name} ${d.type} ${d.content}`);
      const score = terms.filter((t) => haystack.includes(t)).length;
      return { d, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => r.d);

  return {
    answer:
      scoredProducts.length || scoredDocs.length
        ? `Found ${scoredProducts.length} matching product(s) and ${scoredDocs.length} matching document(s) for "${question}".`
        : `No products or documents matched "${question}". Try different keywords or a product code.`,
    products: scoredProducts,
    documents: scoredDocs,
    changeRequests: [],
  };
}

// ---------- 2. Document summarization ----------
export function summarizeDocument(doc) {
  const sentences = String(doc.content || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const termFreq = {};
  for (const t of significantTokens(doc.content)) {
    termFreq[t] = (termFreq[t] || 0) + 1;
  }

  const scored = sentences.map((sentence, idx) => {
    const tokens = significantTokens(sentence);
    const score =
      tokens.reduce((sum, t) => sum + (termFreq[t] || 0), 0) / Math.max(tokens.length, 1) -
      idx * 0.02; // slight preference for earlier sentences
    return { sentence, score, idx };
  });

  const topSentences = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .sort((a, b) => a.idx - b.idx)
    .map((s) => s.sentence);

  return {
    summary: topSentences.join(" "),
    keyMetadata: extractMetadata(doc.content),
    sentenceCount: sentences.length,
  };
}

// ---------- 3. Duplicate product detection ----------
function jaccardSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function detectDuplicates(products, threshold = 0.35) {
  const pairs = [];
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const a = products[i];
      const b = products[j];
      if (a.category !== b.category) continue;

      const nameSim = jaccardSimilarity(significantTokens(a.name), significantTokens(b.name));
      const descSim = jaccardSimilarity(significantTokens(a.description), significantTokens(b.description));
      const tagSim = jaccardSimilarity(a.tags || [], b.tags || []);
      const score = nameSim * 0.5 + descSim * 0.35 + tagSim * 0.15;

      if (score >= threshold) {
        pairs.push({
          productA: { id: a.id, code: a.code, name: a.name },
          productB: { id: b.id, code: b.code, name: b.name },
          similarity: Math.round(score * 100) / 100,
          reason:
            nameSim > 0.5
              ? "Near-identical product names"
              : descSim > 0.4
              ? "Highly overlapping descriptions"
              : "Similar tags and category",
        });
      }
    }
  }
  return pairs.sort((a, b) => b.similarity - a.similarity);
}

// ---------- 4. Automated metadata extraction ----------
const METADATA_PATTERNS = [
  "Material", "Weight", "Revision", "Compliance Standard", "Operating Temperature",
  "Pressure Rating", "Capacity", "Cure Time", "VOC Content", "Fire Rating",
  "Power Rating", "Platform", "License Model", "Battery Life", "Cycle Life",
  "Seal Type", "Finish", "Test Lab", "Certificate Valid Through",
];

export function extractMetadata(text) {
  const result = {};
  const source = String(text || "");
  for (const field of METADATA_PATTERNS) {
    const re = new RegExp(`${field}:\\s*([^.]+?)(?:\\.|$)`, "i");
    const match = source.match(re);
    if (match) {
      result[field] = match[1].trim();
    }
  }
  return result;
}

// ---------- 5. Product data quality recommendations ----------
export function dataQualityReport(ctx) {
  const { products, documents, changeRequests } = ctx;
  const issues = [];
  const now = new Date();

  for (const p of products) {
    if (!p.owner || !p.owner.trim()) {
      issues.push({
        severity: "high",
        productId: p.id,
        productName: p.name,
        issue: "Missing product owner",
        recommendation: "Assign a responsible owner so lifecycle and compliance decisions have a clear approver.",
      });
    }
    if (!p.description || !p.description.trim()) {
      issues.push({
        severity: "medium",
        productId: p.id,
        productName: p.name,
        issue: "Missing product description",
        recommendation: "Add a description so search and AI retrieval can surface this product accurately.",
      });
    }
    if (documents.filter((d) => d.productId === p.id).length === 0 && p.lifecycleStage !== "concept") {
      issues.push({
        severity: "medium",
        productId: p.id,
        productName: p.name,
        issue: "No documents attached",
        recommendation: "Attach at least a specification document to support audits and change reviews.",
      });
    }
    if (p.eolDate && new Date(p.eolDate) < now && !["end_of_life", "obsolete"].includes(p.lifecycleStage)) {
      issues.push({
        severity: "high",
        productId: p.id,
        productName: p.name,
        issue: `Lifecycle stage "${LIFECYCLE_LABELS[p.lifecycleStage]}" is inconsistent with a past end-of-life date (${p.eolDate})`,
        recommendation: "Update the lifecycle stage to End-of-Life or Obsolete, or correct the EOL date.",
      });
    }
    if (p.lifecycleStage === "active" && daysBetween(new Date(p.updatedAt), now) > 365) {
      issues.push({
        severity: "low",
        productId: p.id,
        productName: p.name,
        issue: `No updates in ${Math.round(daysBetween(new Date(p.updatedAt), now))} days`,
        recommendation: "Schedule a lifecycle review to confirm the product record is still accurate.",
      });
    }
    if (p.complianceStatus === "non_compliant") {
      const hasOpenCR = unresolvedCRsFor(p.id, changeRequests).length > 0;
      if (!hasOpenCR) {
        issues.push({
          severity: "high",
          productId: p.id,
          productName: p.name,
          issue: "Non-compliant with no open change request to remediate it",
          recommendation: "Open a change request to track remediation of the compliance gap.",
        });
      }
    }
  }

  const severityRank = { high: 0, medium: 1, low: 2 };
  return issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

export function dashboardStats(ctx) {
  const { products, changeRequests, documents } = ctx;
  const byStage = {};
  for (const p of products) byStage[p.lifecycleStage] = (byStage[p.lifecycleStage] || 0) + 1;

  const byCompliance = {};
  for (const p of products) byCompliance[p.complianceStatus] = (byCompliance[p.complianceStatus] || 0) + 1;

  const approachingEol = products.filter((p) => isApproachingEol(p));
  const eolWithUnresolvedCR = approachingEol.filter((p) => unresolvedCRsFor(p.id, changeRequests).length > 0);

  const openCRs = changeRequests.filter((c) => UNRESOLVED_CR_STATUSES.includes(c.status));
  const crByStatus = {};
  for (const c of changeRequests) crByStatus[c.status] = (crByStatus[c.status] || 0) + 1;

  return {
    totalProducts: products.length,
    totalDocuments: documents.length,
    byStage,
    byCompliance,
    approachingEolCount: approachingEol.length,
    eolWithUnresolvedCRCount: eolWithUnresolvedCR.length,
    openChangeRequestCount: openCRs.length,
    crByStatus,
    dataQualityIssueCount: dataQualityReport(ctx).length,
    duplicateCandidateCount: detectDuplicates(products).length,
  };
}

export { isApproachingEol, unresolvedCRsFor };
