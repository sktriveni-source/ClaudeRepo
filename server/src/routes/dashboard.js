import { Router } from "express";
import { db, daysBetween } from "../store/db.js";
import { forecastSummary } from "../services/pipelineService.js";
import { detectOpportunityRisk } from "../services/aiService.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", (req, res) => {
  const openOpps = db.opportunities.filter((o) => o.status === "Open");
  const forecast = forecastSummary({});

  const riskyOpps = openOpps
    .map((o) => ({ opp: o, risk: detectOpportunityRisk(o) }))
    .filter(({ risk }) => risk.riskLevel === "High")
    .map(({ opp, risk }) => ({
      opportunityId: opp.opportunityId,
      opportunityName: opp.opportunityName,
      accountId: opp.accountId,
      summary: risk.summary,
    }));

  const staleAccounts = db.accounts.filter((acct) => {
    const acctActivities = db.activities.filter((a) => a.accountId === acct.accountId);
    if (acctActivities.length === 0) return true;
    const mostRecent = acctActivities.sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate))[0];
    return daysBetween(mostRecent.activityDate) > 30;
  }).length;

  const leadsByStatus = ["New", "Contacted", "Qualified", "Converted", "Disqualified"].map((status) => ({
    status,
    count: db.leads.filter((l) => l.leadStatus === status).length,
  }));

  res.json({
    kpis: {
      totalAccounts: db.accounts.length,
      openOpportunities: openOpps.length,
      totalPipeline: forecast.totalPipeline,
      weightedPipeline: forecast.weightedPipeline,
      salesTarget: forecast.salesTarget,
      closedWon: forecast.closedWon,
      openLeads: db.leads.filter((l) => !["Converted", "Disqualified"].includes(l.leadStatus)).length,
      staleAccounts,
    },
    leadsByStatus,
    riskyOpportunities: riskyOpps,
    aiHighlight: forecast.aiHighlight,
  });
});
