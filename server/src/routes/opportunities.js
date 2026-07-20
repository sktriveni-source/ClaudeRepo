import { Router } from "express";
import { db, nextId, recordAudit, userName } from "../store/db.js";
import { weightedRevenue, filterOpportunities, pipelineByStage, forecastSummary } from "../services/pipelineService.js";
import { detectOpportunityRisk } from "../services/aiService.js";

export const opportunitiesRouter = Router();

function withComputed(o) {
  const account = db.accounts.find((a) => a.accountId === o.accountId);
  return {
    ...o,
    ownerName: userName(o.ownerId),
    accountName: account?.accountName || "",
    weightedRevenue: weightedRevenue(o),
    riskLevel: detectOpportunityRisk(o).riskLevel,
  };
}

opportunitiesRouter.get("/pipeline", (req, res) => {
  res.json(pipelineByStage(req.query));
});

opportunitiesRouter.get("/forecast", (req, res) => {
  res.json(forecastSummary(req.query));
});

opportunitiesRouter.get("/", (req, res) => {
  const list = filterOpportunities(req.query);
  res.json(list.map(withComputed));
});

opportunitiesRouter.get("/:id", (req, res) => {
  const opp = db.opportunities.find((o) => o.opportunityId === req.params.id);
  if (!opp) return res.status(404).json({ error: "Opportunity not found" });
  res.json(withComputed(opp));
});

opportunitiesRouter.post("/", (req, res) => {
  const opp = {
    opportunityId: nextId("O"),
    accountId: req.body.accountId,
    opportunityName: req.body.opportunityName,
    ownerId: req.body.ownerId || "",
    stage: req.body.stage || "Prospecting",
    estimatedValue: Number(req.body.estimatedValue) || 0,
    probability: Number(req.body.probability) || 10,
    expectedCloseDate: req.body.expectedCloseDate || "",
    status: "Open",
    products: req.body.products || [],
    competitors: req.body.competitors || [],
    decisionMakers: req.body.decisionMakers || [],
    risks: req.body.risks || [],
    nextAction: req.body.nextAction || "",
  };
  db.opportunities.push(opp);
  recordAudit({ entityType: "Opportunity", entityId: opp.opportunityId, action: "Create", newValue: opp.opportunityName });
  res.status(201).json(withComputed(opp));
});

opportunitiesRouter.put("/:id", (req, res) => {
  const opp = db.opportunities.find((o) => o.opportunityId === req.params.id);
  if (!opp) return res.status(404).json({ error: "Opportunity not found" });
  const beforeStage = opp.stage;
  Object.assign(opp, req.body, { opportunityId: opp.opportunityId });
  if (opp.stage === "Closed Won" || opp.stage === "Closed Lost") {
    opp.status = opp.stage;
    opp.probability = opp.stage === "Closed Won" ? 100 : 0;
  }
  if (beforeStage !== opp.stage) {
    recordAudit({ entityType: "Opportunity", entityId: opp.opportunityId, action: "Update", oldValue: `Stage: ${beforeStage}`, newValue: `Stage: ${opp.stage}` });
  }
  res.json(withComputed(opp));
});
