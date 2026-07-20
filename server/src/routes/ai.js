import { Router } from "express";
import { db } from "../store/db.js";
import { scoreLead, detectOpportunityRisk, nextBestAction, customerSummary, answerQuery, summarizeTimeline } from "../services/aiService.js";

export const aiRouter = Router();

aiRouter.post("/customer-summary", (req, res) => {
  const account = db.accounts.find((a) => a.accountId === req.body.accountId);
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json(customerSummary(account));
});

aiRouter.post("/lead-score", (req, res) => {
  const lead = db.leads.find((l) => l.leadId === req.body.leadId);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json(scoreLead(lead));
});

aiRouter.post("/opportunity-risk", (req, res) => {
  const opp = db.opportunities.find((o) => o.opportunityId === req.body.opportunityId);
  if (!opp) return res.status(404).json({ error: "Opportunity not found" });
  res.json(detectOpportunityRisk(opp));
});

aiRouter.post("/next-best-action", (req, res) => {
  const opp = db.opportunities.find((o) => o.opportunityId === req.body.opportunityId);
  if (!opp) return res.status(404).json({ error: "Opportunity not found" });
  res.json(nextBestAction(opp));
});

aiRouter.post("/timeline-summary", (req, res) => {
  const acctActivities = db.activities.filter((a) => a.accountId === req.body.accountId);
  res.json({ accountId: req.body.accountId, summary: summarizeTimeline(acctActivities) });
});

aiRouter.post("/query", (req, res) => {
  const { question, ownerId } = req.body;
  if (!question) return res.status(400).json({ error: "question is required" });
  res.json(answerQuery(question, { ownerId }));
});
