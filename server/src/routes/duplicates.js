import { Router } from "express";
import { DOMAINS, getDuplicateClusters, getDuplicateCluster, addApproval, logAudit } from "../store/db.js";
import { detectDuplicates } from "../services/duplicateDetection.js";

const router = Router();

router.get("/:domain", (req, res) => {
  const { domain } = req.params;
  if (!DOMAINS.includes(domain)) return res.status(404).json({ error: "Unknown domain" });
  const existing = getDuplicateClusters(domain);
  res.json(existing.length ? existing : detectDuplicates(domain));
});

router.post("/:domain/run", (req, res) => {
  const { domain } = req.params;
  if (!DOMAINS.includes(domain)) return res.status(404).json({ error: "Unknown domain" });
  const clusters = detectDuplicates(domain);
  logAudit("duplicates.scan", { domain, clustersFound: clusters.length });
  res.json(clusters);
});

router.post("/:domain/:clusterId/resolve", (req, res) => {
  const { domain, clusterId } = req.params;
  const { action, goldenRecordId, requestedBy } = req.body || {};
  const cluster = getDuplicateCluster(domain, clusterId);
  if (!cluster) return res.status(404).json({ error: "Cluster not found" });
  if (!["merge", "reject"].includes(action)) return res.status(400).json({ error: 'action must be "merge" or "reject"' });

  const golden = goldenRecordId || cluster.suggestedGoldenRecordId;
  const approval = addApproval({
    type: action === "merge" ? "merge_duplicate" : "reject_duplicate",
    domain,
    requestedBy: requestedBy || "data.steward@company.com",
    payload: {
      clusterId,
      goldenRecordId: golden,
      memberIds: cluster.members.map((m) => m.id),
      confidence: cluster.confidence,
    },
    description:
      action === "merge"
        ? `Merge ${cluster.members.length} duplicate ${domain} into golden record ${golden}`
        : `Dismiss duplicate cluster ${clusterId} in ${domain} as not a match`,
  });
  cluster.status = "pending_approval";
  logAudit("duplicates.resolution_requested", { clusterId, action });
  res.status(202).json(approval);
});

export default router;
