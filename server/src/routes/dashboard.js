import { Router } from "express";
import { DOMAINS, getDataSources, getIssues, getDuplicateClusters, getApprovals, getRecords } from "../store/db.js";
import { scoreAllDomains } from "../services/qualityScoring.js";

const router = Router();

function buildTrend(current) {
  // Deterministic mock trend leading up to today's computed score, so the
  // dashboard has a sparkline without needing historical snapshots.
  const points = [-9, -6, -4, -2, 0].map((delta, i) => Math.max(40, Math.min(100, current - 9 + i * 2 + delta * 0.3)));
  points[points.length - 1] = current;
  const weeksAgo = [8, 6, 4, 2, 0];
  return weeksAgo.map((w, i) => ({ label: w === 0 ? "This week" : `${w}w ago`, score: Math.round(points[i]) }));
}

router.get("/summary", (req, res) => {
  const quality = scoreAllDomains();
  const allIssues = getIssues();
  const openIssues = allIssues.filter((i) => i.status === "open");

  const issuesBySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  const issuesByCategory = { completeness: 0, validity: 0, duplicate: 0, anomaly: 0 };
  for (const i of openIssues) {
    if (issuesBySeverity[i.severity] !== undefined) issuesBySeverity[i.severity]++;
    if (issuesByCategory[i.category] !== undefined) issuesByCategory[i.category]++;
  }

  const clusters = DOMAINS.flatMap((d) => getDuplicateClusters(d));
  const openClusters = clusters.filter((c) => c.status === "open" || c.status === "pending_approval");
  issuesByCategory.duplicate = openClusters.length;

  const approvals = getApprovals({ status: "pending" });
  const sources = getDataSources();

  res.json({
    overallScore: quality.overall,
    trend: buildTrend(quality.overall),
    domains: quality.domains.map((d) => ({ domain: d.domain, score: d.overall, recordCount: d.recordCount, dimensions: d.dimensions })),
    recordTotals: Object.fromEntries(DOMAINS.map((d) => [d, getRecords(d).length])),
    dataSources: { total: sources.length, connected: sources.filter((s) => s.status === "connected").length, degraded: sources.filter((s) => s.status === "degraded").length },
    issues: { open: openIssues.length, total: allIssues.length, bySeverity: issuesBySeverity, byCategory: issuesByCategory },
    duplicates: { openClusters: openClusters.length, totalClusters: clusters.length, recordsInvolved: openClusters.reduce((s, c) => s + c.members.length, 0) },
    approvals: { pending: approvals.length },
  });
});

export default router;
