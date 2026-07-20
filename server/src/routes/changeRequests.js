import { Router } from "express";
import {
  listChangeRequests,
  getChangeRequest,
  createChangeRequest,
  updateChangeRequest,
  getProduct,
} from "../store/db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

export const changeRequestsRouter = Router();
changeRequestsRouter.use(requireAuth);

changeRequestsRouter.get("/", requirePermission("changeRequests:read"), (req, res) => {
  const { status, priority, productId } = req.query;
  let results = listChangeRequests();
  if (status) results = results.filter((c) => c.status === status);
  if (priority) results = results.filter((c) => c.priority === priority);
  if (productId) results = results.filter((c) => c.productId === productId);
  res.json(results);
});

changeRequestsRouter.get("/:id", requirePermission("changeRequests:read"), (req, res) => {
  const cr = getChangeRequest(req.params.id);
  if (!cr) return res.status(404).json({ error: "Change request not found" });
  res.json(cr);
});

changeRequestsRouter.post("/", requirePermission("changeRequests:write"), (req, res) => {
  const { productId, title, description } = req.body || {};
  if (!productId || !title) {
    return res.status(400).json({ error: "productId and title are required" });
  }
  if (!getProduct(productId)) return res.status(404).json({ error: "Product not found" });
  const cr = createChangeRequest({ ...req.body, requestedBy: req.user.name }, req.user.name);
  res.status(201).json(cr);
});

changeRequestsRouter.put("/:id", (req, res, next) => {
  // Approving/rejecting requires elevated permission; other edits use the base write permission.
  const patch = req.body || {};
  const approvalStatuses = ["approved", "rejected"];
  const action = patch.status && approvalStatuses.includes(patch.status)
    ? "changeRequests:approve"
    : "changeRequests:write";
  return requirePermission(action)(req, res, next);
}, (req, res) => {
  const cr = updateChangeRequest(req.params.id, req.body || {}, req.user.name);
  if (!cr) return res.status(404).json({ error: "Change request not found" });
  res.json(cr);
});
