// Statistical outlier detection ("AI opportunity: anomaly detection") over
// numeric fields, grouped by a natural cohort (product category, supplier
// category) so a $999 cable is compared against other electronics, not
// against pallets and paperclips.
import { getRecords, addIssue, clearIssuesFromRun } from "../store/db.js";

const FIELD_CONFIG = {
  products: { field: "unitPrice", groupBy: "category", label: "unit price" },
  suppliers: { field: "paymentTermsDays", groupBy: "category", label: "payment terms" },
  customers: { field: "lifetimeValue", groupBy: null, label: "lifetime value" },
};

function stats(values) {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return { mean, stddev: Math.sqrt(variance) };
}

export function detectAnomalies(domain) {
  const cfg = FIELD_CONFIG[domain];
  if (!cfg) return [];
  const records = getRecords(domain);

  const groups = new Map();
  for (const r of records) {
    const key = cfg.groupBy ? r[cfg.groupBy] : "__all__";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  clearIssuesFromRun(domain, "anomaly");
  const anomalies = [];

  for (const group of groups.values()) {
    const values = group.map((r) => r[cfg.field]).filter((v) => typeof v === "number");
    if (values.length < 3) continue;
    const { mean, stddev } = stats(values);
    if (stddev === 0) continue;

    for (const r of group) {
      const value = r[cfg.field];
      if (typeof value !== "number") continue;
      const z = (value - mean) / stddev;
      if (Math.abs(z) >= 2) {
        const direction = z > 0 ? "unusually high" : "unusually low";
        const issue = addIssue({
          domain,
          recordId: r.id,
          sourceId: r.sourceId,
          category: "anomaly",
          field: cfg.field,
          severity: Math.abs(z) >= 3 ? "high" : "medium",
          description: `${r.name || r.sku}: ${cfg.label} of ${value} is ${direction} (z-score ${z.toFixed(2)}, cohort mean ${mean.toFixed(2)})`,
        });
        anomalies.push({ ...issue, zScore: +z.toFixed(2), cohortMean: +mean.toFixed(2), value });
      }
    }
  }
  return anomalies;
}
