import { getRecords, getDataSources } from "../store/db.js";

const HIDDEN_FIELDS = new Set(["id", "sourceId", "sourceRecordId"]);

function classifyPattern(field, value) {
  const v = String(value);
  if (field.toLowerCase().includes("phone")) {
    if (/^\(\d{3}\) \d{3}-\d{4}$/.test(v)) return "(NNN) NNN-NNNN";
    if (/^\d{3}-\d{3}-\d{4}$/.test(v)) return "NNN-NNN-NNNN";
    if (/^\d{3}\.\d{3}\.\d{4}$/.test(v)) return "NNN.NNN.NNNN";
    return "other";
  }
  if (field.toLowerCase().includes("taxid")) {
    if (/^\d{2}-\d{7}$/.test(v)) return "NN-NNNNNNN";
    if (/^\d{9}$/.test(v)) return "NNNNNNNNN";
    return "other";
  }
  if (field.toLowerCase() === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "valid-email" : "invalid-email";
  }
  if (typeof value === "number") return "numeric";
  return "text";
}

function inferType(values) {
  if (values.every((v) => typeof v === "number")) return "number";
  if (values.every((v) => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) return "date";
  return "string";
}

export function profileDomain(domain) {
  const records = getRecords(domain);
  if (records.length === 0) return { domain, recordCount: 0, fields: [], sources: [] };

  const fieldNames = Object.keys(records[0]).filter((f) => !HIDDEN_FIELDS.has(f));

  const fields = fieldNames.map((field) => {
    const values = records.map((r) => r[field]);
    const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
    const nullCount = values.length - nonNull.length;
    const distinct = new Set(nonNull.map((v) => String(v).toLowerCase().trim()));
    const type = nonNull.length ? inferType(nonNull) : "string";

    const patternCounts = {};
    for (const v of nonNull) {
      const p = classifyPattern(field, v);
      patternCounts[p] = (patternCounts[p] || 0) + 1;
    }
    const patternEntries = Object.entries(patternCounts).sort((a, b) => b[1] - a[1]);
    const dominantPattern = patternEntries[0]?.[0] ?? null;
    const patternCount = patternEntries.length;
    const consistency = nonNull.length ? (patternEntries[0]?.[1] ?? 0) / nonNull.length : 1;

    return {
      field,
      type,
      completeness: values.length ? +(nonNull.length / values.length).toFixed(3) : 1,
      nullCount,
      distinctCount: distinct.size,
      uniqueness: nonNull.length ? +(distinct.size / nonNull.length).toFixed(3) : 1,
      formatConsistency: +consistency.toFixed(3),
      patternVariants: patternCount,
      patterns: patternEntries.slice(0, 4).map(([pattern, count]) => ({ pattern, count })),
      sampleValues: [...new Set(nonNull.map(String))].slice(0, 3),
    };
  });

  const sourceIds = [...new Set(records.map((r) => r.sourceId))];
  const sources = getDataSources().filter((s) => sourceIds.includes(s.id));

  const avgCompleteness = fields.reduce((sum, f) => sum + f.completeness, 0) / fields.length;
  const avgConsistency = fields.reduce((sum, f) => sum + f.formatConsistency, 0) / fields.length;

  return {
    domain,
    recordCount: records.length,
    sources: sources.map((s) => ({ id: s.id, name: s.name, recordCount: records.filter((r) => r.sourceId === s.id).length })),
    fields,
    summary: {
      avgCompleteness: +avgCompleteness.toFixed(3),
      avgFormatConsistency: +avgConsistency.toFixed(3),
      weakestFields: [...fields].sort((a, b) => a.completeness - b.completeness).slice(0, 3).map((f) => f.field),
      inconsistentFields: [...fields].filter((f) => f.patternVariants > 1).sort((a, b) => a.formatConsistency - b.formatConsistency).map((f) => f.field),
    },
  };
}
