import { db, daysBetween } from "../store/db.js";

const STAGES = ["Prospecting", "Qualification", "Needs Analysis", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

export function weightedRevenue(opportunity) {
  return Math.round(opportunity.estimatedValue * (opportunity.probability / 100));
}

export function filterOpportunities(query = {}) {
  let list = [...db.opportunities];
  if (query.ownerId) list = list.filter((o) => o.ownerId === query.ownerId);
  if (query.stage) list = list.filter((o) => o.stage === query.stage);
  if (query.accountId) list = list.filter((o) => o.accountId === query.accountId);
  if (query.region) {
    list = list.filter((o) => db.accounts.find((a) => a.accountId === o.accountId)?.region === query.region);
  }
  if (query.country) {
    list = list.filter((o) => db.accounts.find((a) => a.accountId === o.accountId)?.country === query.country);
  }
  if (query.product) {
    list = list.filter((o) => o.products?.includes(query.product));
  }
  if (query.status) list = list.filter((o) => o.status === query.status);
  return list;
}

export function pipelineByStage(query = {}) {
  const list = filterOpportunities(query).filter((o) => o.status === "Open");
  return STAGES.filter((s) => s !== "Closed Lost").map((stage) => {
    const stageOpps = list.filter((o) => o.stage === stage);
    return {
      stage,
      count: stageOpps.length,
      value: stageOpps.reduce((sum, o) => sum + o.estimatedValue, 0),
      weightedValue: stageOpps.reduce((sum, o) => sum + weightedRevenue(o), 0),
    };
  });
}

export function forecastSummary(query = {}) {
  const list = filterOpportunities(query);
  const openOpps = list.filter((o) => o.status === "Open");
  const closedWon = list.filter((o) => o.status === "Closed Won");

  const totalPipeline = openOpps.reduce((sum, o) => sum + o.estimatedValue, 0);
  const weightedPipeline = openOpps.reduce((sum, o) => sum + weightedRevenue(o), 0);
  const committed = openOpps.filter((o) => o.probability >= 65).reduce((sum, o) => sum + o.estimatedValue, 0);
  const bestCase = openOpps.filter((o) => o.probability >= 40).reduce((sum, o) => sum + o.estimatedValue, 0);
  const closedWonValue = closedWon.reduce((sum, o) => sum + o.estimatedValue, 0);

  const targets = query.ownerId
    ? db.salesTargets.filter((t) => t.salesPersonId === query.ownerId)
    : db.salesTargets.filter((t) => t.salesPersonId === "ALL");
  const salesTarget = targets.reduce((sum, t) => sum + t.targetAmount, 0);

  const staleHighValue = openOpps.filter((o) => {
    const acctActivities = db.activities.filter((a) => a.opportunityId === o.opportunityId);
    const mostRecent = acctActivities.sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate))[0];
    const staleDays = mostRecent ? daysBetween(mostRecent.activityDate) : 999;
    return o.estimatedValue >= 500000 && staleDays > 30;
  });

  let aiHighlight = "The pipeline is tracking well against the quarterly target.";
  if (salesTarget > 0 && weightedPipeline < salesTarget * 0.85) {
    aiHighlight = `The current weighted pipeline ($${(weightedPipeline / 1e6).toFixed(1)}M) is below the level historically required to achieve the target ($${(salesTarget / 1e6).toFixed(1)}M).`;
    if (staleHighValue.length > 0) {
      aiHighlight += ` ${staleHighValue.length} high-value opportunit${staleHighValue.length === 1 ? "y has" : "ies have"} no activity recorded during the past 30 days.`;
    }
  } else if (staleHighValue.length > 0) {
    aiHighlight = `${staleHighValue.length} high-value opportunit${staleHighValue.length === 1 ? "y has" : "ies have"} no activity recorded during the past 30 days.`;
  }

  return {
    salesTarget,
    totalPipeline,
    weightedPipeline,
    committed,
    bestCase,
    closedWon: closedWonValue,
    aiHighlight,
    staleHighValueOpportunities: staleHighValue.map((o) => ({ id: o.opportunityId, name: o.opportunityName })),
  };
}
