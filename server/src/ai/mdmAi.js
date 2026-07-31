import { generateText, withAiFallback } from "./aiClient.js";

function normalize(v) {
  return (v ?? "").toString().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fieldSimilarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length < nb.length ? nb : na;
  return longer.includes(shorter) ? 0.75 : 0;
}

/** Heuristic duplicate detection: compares name, email/taxId, and phone across records of the same entity type. */
export function detectDuplicates(records) {
  const pairs = [];
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i];
      const b = records[j];
      if (a.entityType !== b.entityType) continue;
      const nameSim = fieldSimilarity(a.attributes.name, b.attributes.name);
      const keyMatch =
        (a.attributes.email && a.attributes.email === b.attributes.email) ||
        (a.attributes.taxId && a.attributes.taxId === b.attributes.taxId) ||
        (a.attributes.sku && normalize(a.attributes.sku) === normalize(b.attributes.sku));
      const confidence = keyMatch ? Math.max(nameSim, 0.8) : nameSim;
      if (confidence >= 0.6) {
        pairs.push({
          recordA: a,
          recordB: b,
          confidence: Math.round(confidence * 100),
          matchedOn: [
            nameSim > 0 ? "name" : null,
            a.attributes.email && a.attributes.email === b.attributes.email ? "email" : null,
            a.attributes.taxId && a.attributes.taxId === b.attributes.taxId ? "taxId" : null,
            a.attributes.sku && normalize(a.attributes.sku) === normalize(b.attributes.sku) ? "sku" : null,
          ].filter(Boolean),
        });
      }
    }
  }
  return pairs.sort((a, b) => b.confidence - a.confidence);
}

function heuristicCleansingSuggestions(record) {
  const suggestions = [];
  const attrs = record.attributes;
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === "" || value === "not set") {
      suggestions.push(`Populate missing '${key}' attribute.`);
    }
  }
  if (attrs.phone && !/^\+/.test(attrs.phone)) {
    suggestions.push("Standardize phone number to include country code (+CC format).");
  }
  if (attrs.sku && attrs.sku !== attrs.sku.toUpperCase()) {
    suggestions.push(`Normalize SKU to uppercase: '${attrs.sku.toUpperCase()}'.`);
  }
  if (attrs.name && / {2,}/.test(attrs.name)) {
    suggestions.push("Remove extra whitespace from name field.");
  }
  if ((record.issues || []).includes("DUPLICATE")) {
    suggestions.push("Review flagged duplicate and merge into the survivor record.");
  }
  return suggestions;
}

export async function cleansingSuggestions(record) {
  return withAiFallback(
    async () => {
      const text = await generateText({
        system:
          "You are a data-quality assistant for an MDM (Master Data Management) platform. Given a master record's attributes and detected issues, list specific, actionable cleansing suggestions as a JSON array of short strings. Respond with ONLY the JSON array, no prose.",
        prompt: `Entity type: ${record.entityType}\nAttributes: ${JSON.stringify(record.attributes)}\nDetected issues: ${JSON.stringify(record.issues || [])}`,
        maxTokens: 400,
      });
      const { extractJson } = await import("./aiClient.js");
      const parsed = extractJson(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { suggestions: parsed };
      }
      throw new Error("Could not parse AI suggestions");
    },
    () => ({ suggestions: heuristicCleansingSuggestions(record) })
  );
}

/** Very small heuristic NL-to-filter translator covering the spec's example query shape. */
export function interpretQuery(question, records) {
  const q = question.toLowerCase();
  let results = records;

  const entityMatch = ["supplier", "customer", "product"].find((t) => q.includes(t));
  if (entityMatch) {
    const target = entityMatch.charAt(0).toUpperCase() + entityMatch.slice(1);
    results = results.filter((r) => r.entityType === target);
  }
  if (q.includes("incomplete") || q.includes("missing")) {
    results = results.filter((r) => (r.issues || []).includes("INCOMPLETE"));
  }
  if (q.includes("duplicate")) {
    results = results.filter((r) => (r.issues || []).includes("DUPLICATE"));
  }
  if (q.includes("conflict")) {
    results = results.filter((r) => (r.issues || []).includes("CONFLICT"));
  }
  if (q.includes("address")) {
    results = results.filter((r) => !r.attributes.address);
  }
  if (q.includes("tax")) {
    const taxCounts = new Map();
    for (const r of records) {
      if (r.attributes.taxId) taxCounts.set(r.attributes.taxId, (taxCounts.get(r.attributes.taxId) || 0) + 1);
    }
    const duplicateTaxIds = new Set([...taxCounts.entries()].filter(([, c]) => c > 1).map(([id]) => id));
    if (duplicateTaxIds.size > 0) {
      results = results.filter((r) => duplicateTaxIds.has(r.attributes.taxId));
    }
  }
  return results;
}

export async function answerDataQuestion(question, records) {
  const matches = interpretQuery(question, records);
  return withAiFallback(
    async () => {
      const context = JSON.stringify(
        matches.slice(0, 20).map((r) => ({ id: r.id, entityType: r.entityType, attributes: r.attributes, issues: r.issues })),
        null,
        2
      );
      const text = await generateText({
        system:
          "You are an AI assistant for a Master Data Management (MDM) platform. The user asks natural-language questions about data quality (duplicates, missing fields, conflicts). You are given the matching records already retrieved by the platform's query engine. Summarize the findings in 2-4 sentences, citing record IDs and specific field problems. Do not invent records not present in the context.",
        prompt: `Question: ${question}\n\nMatching records:\n${context}\n\nTotal matches: ${matches.length}`,
        maxTokens: 500,
      });
      return { answer: text.trim(), matches };
    },
    () => ({
      answer:
        matches.length > 0
          ? `Found ${matches.length} record(s) matching the query: ${matches.map((r) => `${r.id} (${r.attributes.name || r.entityType})`).join(", ")}.`
          : "No records matched that query.",
      matches,
    })
  );
}
