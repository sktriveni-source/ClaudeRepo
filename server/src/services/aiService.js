// Rule-based "AI" services. These simulate the intelligent behaviors described
// in the business case (lead scoring, risk detection, summarization, next
// best action, NL query) with deterministic heuristics over the in-memory
// CRM data, so the platform is fully demoable without an external LLM
// dependency. Swap the internals for real model calls (Azure AI Foundry /
// an enterprise LLM) without changing the calling API surface.
import { db, TODAY, daysBetween, userName, recordInsight } from "../store/db.js";

const TARGET_INDUSTRIES = ["Telecom", "Financial Services", "Energy", "Healthcare"];
const SOURCE_CONVERSION_WEIGHT = {
  Referral: 25,
  "Marketing Campaign": 15,
  Partner: 18,
  Webinar: 14,
  Website: 10,
  "Trade Show": 12,
  "Cold Outreach": 5,
};

export function scoreLead(lead) {
  const reasons = [];
  let score = 0;

  // Engagement signal (0-40 points)
  const engagementPoints = Math.round((lead.engagementScore / 100) * 40);
  score += engagementPoints;
  if (lead.engagementScore >= 70) reasons.push("Strong engagement");
  else if (lead.engagementScore <= 25) reasons.push("Low engagement so far");

  // Target industry (0-20 points)
  if (TARGET_INDUSTRIES.includes(lead.industry)) {
    score += 20;
    reasons.push("Target industry");
  } else {
    score += 8;
  }

  // Company size sweet spot (0-20 points)
  if (lead.companySize >= 800 && lead.companySize <= 5000) {
    score += 20;
    reasons.push("Appropriate company size");
  } else if (lead.companySize > 5000) {
    score += 14;
    reasons.push("Large enterprise account");
  } else {
    score += 8;
  }

  // Historical conversion pattern by source (0-20 points)
  const sourceWeight = SOURCE_CONVERSION_WEIGHT[lead.leadSource] ?? 8;
  score += sourceWeight;
  if (sourceWeight >= 18) reasons.push(`${lead.leadSource} leads convert well historically`);

  score = Math.max(0, Math.min(100, score));

  let recommendation = "Low-priority lead";
  if (score >= 75) recommendation = "High-priority lead";
  else if (score >= 50) recommendation = "Medium-priority lead";

  if (lead.leadStatus === "Disqualified") {
    reasons.push("Currently disqualified");
  }

  return { leadId: lead.leadId, score, recommendation, reasons };
}

export function detectOpportunityRisk(opportunity) {
  if (opportunity.status !== "Open") {
    return { opportunityId: opportunity.opportunityId, riskLevel: "None", reasons: [], summary: "Opportunity is closed." };
  }

  const reasons = [];
  const acctActivities = db.activities
    .filter((a) => a.opportunityId === opportunity.opportunityId)
    .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  const lastActivity = acctActivities[0];
  const daysSinceActivity = lastActivity ? daysBetween(lastActivity.activityDate) : null;
  const daysToClose = -daysBetween(opportunity.expectedCloseDate);

  if (daysSinceActivity === null || daysSinceActivity > 30) {
    reasons.push(
      daysSinceActivity === null
        ? "No customer activity has been recorded"
        : `No customer interaction recorded for ${daysSinceActivity} days`
    );
  }

  if (!opportunity.decisionMakers || opportunity.decisionMakers.length === 0) {
    reasons.push("No identified decision maker");
  }

  if (opportunity.stage === "Proposal" && daysSinceActivity !== null && daysSinceActivity > 14) {
    reasons.push("Proposal has been pending too long without follow-up");
  }

  if (opportunity.competitors && opportunity.competitors.length > 0) {
    reasons.push(`Competitor involvement: ${opportunity.competitors.join(", ")}`);
  }

  if (daysToClose >= 0 && daysToClose <= 14 && (daysSinceActivity === null || daysSinceActivity > 14)) {
    reasons.push(`Expected close date is in ${daysToClose} days with limited recent engagement`);
  }

  if (opportunity.risks && opportunity.risks.length > 0) {
    reasons.push(...opportunity.risks);
  }

  let riskLevel = "Low";
  if (reasons.length >= 3) riskLevel = "High";
  else if (reasons.length >= 1) riskLevel = "Medium";

  let summary = "No significant risk factors detected.";
  if (riskLevel !== "Low") {
    const closeClause =
      daysToClose >= 0 ? `The expected close date is in ${daysToClose} days` : `The expected close date has passed`;
    const activityClause =
      daysSinceActivity === null
        ? "no customer interaction has been recorded"
        : `no customer interaction has been recorded for ${daysSinceActivity} days`;
    const dmClause =
      !opportunity.decisionMakers || opportunity.decisionMakers.length === 0
        ? " and no identified decision maker exists"
        : "";
    summary = `${closeClause}, but ${activityClause}${dmClause}.`;
  }

  return { opportunityId: opportunity.opportunityId, riskLevel, reasons, summary };
}

export function nextBestAction(opportunity) {
  const risk = detectOpportunityRisk(opportunity);
  const actions = [];

  if (risk.reasons.some((r) => r.includes("No customer interaction") || r.includes("No customer activity"))) {
    actions.push("Schedule customer meeting");
  }
  if (opportunity.stage === "Proposal") {
    actions.push("Follow up on proposal");
  }
  if (!opportunity.decisionMakers || opportunity.decisionMakers.length === 0) {
    actions.push("Engage decision maker");
  }
  if (opportunity.stage === "Needs Analysis" || opportunity.stage === "Qualification") {
    actions.push("Arrange product demonstration");
  }
  if (risk.riskLevel === "High" && -daysBetween(opportunity.expectedCloseDate) < 14) {
    actions.push("Update opportunity close date");
  }
  if (opportunity.stage === "Negotiation" && opportunity.estimatedValue >= 900000) {
    actions.push("Escalate commercial approval");
  }
  if (actions.length === 0) {
    actions.push("Continue regular follow-up cadence");
  }

  return { opportunityId: opportunity.opportunityId, riskLevel: risk.riskLevel, actions: [...new Set(actions)] };
}

export function summarizeTimeline(accountActivities) {
  if (accountActivities.length === 0) {
    return "No recent activity has been recorded for this account.";
  }
  const sorted = [...accountActivities].sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  const latest = sorted[0];
  const types = new Set(sorted.slice(0, 5).map((a) => a.activityType));

  const parts = [];
  if (types.has("Demo") || sorted.some((a) => a.subject.toLowerCase().includes("demonstration"))) {
    parts.push("The customer has completed a technical evaluation");
  }
  if (types.has("Proposal")) {
    parts.push("received a commercial proposal");
  }
  if (types.has("Meeting")) {
    parts.push("engaged in direct meetings with the account team");
  }

  let narrative = parts.length > 0 ? `${parts.join(", ")}.` : `The most recent activity was "${latest.subject}".`;

  const daysSinceLatest = daysBetween(latest.activityDate);
  if (daysSinceLatest > 14) {
    narrative += ` A follow-up is recommended, as it has been ${daysSinceLatest} days since the last recorded interaction.`;
  } else {
    narrative += ` A follow-up meeting is recommended to maintain momentum.`;
  }

  return narrative;
}

export function customerSummary(account) {
  const acctOpportunities = db.opportunities.filter((o) => o.accountId === account.accountId);
  const openOpps = acctOpportunities.filter((o) => o.status === "Open");
  const wonOpps = acctOpportunities.filter((o) => o.status === "Closed Won");
  const pipelineValue = openOpps.reduce((sum, o) => sum + o.estimatedValue, 0);
  const wonValue = wonOpps.reduce((sum, o) => sum + o.estimatedValue, 0);
  const acctActivities = db.activities.filter((a) => a.accountId === account.accountId);
  const openActivities = acctActivities.filter((a) => daysBetween(a.activityDate) <= 14).length;

  const nearCloseOpps = openOpps.filter((o) => {
    const d = -daysBetween(o.expectedCloseDate);
    return d >= 0 && d <= 21;
  });

  const recentActivityTypes = acctActivities
    .filter((a) => daysBetween(a.activityDate) <= 30)
    .map((a) => a.subject);

  const sentences = [];
  if (nearCloseOpps.length > 0) {
    sentences.push(
      `${account.accountName} has ${nearCloseOpps.length} opportunit${nearCloseOpps.length === 1 ? "y" : "ies"} approaching ${nearCloseOpps.length === 1 ? "its" : "their"} expected close date${nearCloseOpps.length === 1 ? "" : "s"}.`
    );
  }
  if (recentActivityTypes.some((s) => /product/i.test(s))) {
    sentences.push("The customer has shown increased interest in recent product discussions.");
  }
  const highRiskOpps = openOpps.filter((o) => detectOpportunityRisk(o).riskLevel === "High");
  if (highRiskOpps.length > 0) {
    sentences.push(
      `${highRiskOpps.length} opportunit${highRiskOpps.length === 1 ? "y is" : "ies are"} flagged at high risk and may need attention.`
    );
  }
  if (sentences.length === 0) {
    sentences.push(`${account.accountName} shows a stable engagement pattern with no immediate red flags.`);
  }

  let health = "Good";
  if (highRiskOpps.length >= 2 || openActivities === 0) health = "At Risk";
  else if (highRiskOpps.length === 1) health = "Fair";

  const summaryText = sentences.join(" ");

  const record = recordInsight({
    entityType: "Account",
    entityId: account.accountId,
    insightType: "CustomerSummary",
    insight: summaryText,
    confidenceScore: 0.8,
  });

  return {
    accountId: account.accountId,
    accountName: account.accountName,
    accountManager: userName(account.accountManagerId),
    industry: account.industry,
    region: account.region,
    openOpportunities: openOpps.length,
    pipelineValue,
    wonBusiness: wonValue,
    openActivities,
    customerHealth: health,
    aiInsight: summaryText,
    insightId: record.insightId,
  };
}

export function answerQuery(question, context = {}) {
  const q = question.toLowerCase();
  const ownerId = context.ownerId;

  const scoped = (list) => (ownerId ? list.filter((o) => o.ownerId === ownerId) : list);

  if (/closing this month|close.*month/.test(q)) {
    const monthEnd = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0);
    const results = scoped(db.opportunities).filter((o) => {
      if (o.status !== "Open") return false;
      const close = new Date(o.expectedCloseDate);
      return close >= TODAY && close <= monthEnd;
    });
    return {
      answer: results.length
        ? `You have ${results.length} open opportunit${results.length === 1 ? "y" : "ies"} closing this month, worth $${(results.reduce((s, o) => s + o.estimatedValue, 0) / 1e6).toFixed(2)}M.`
        : "There are no opportunities closing this month.",
      records: results.map(refOpportunity),
    };
  }

  if (/not been contacted|no activity|no contact|not contacted/.test(q)) {
    const cutoff = 30;
    const results = db.accounts.filter((acct) => {
      const acctActivities = db.activities.filter((a) => a.accountId === acct.accountId);
      if (acctActivities.length === 0) return true;
      const mostRecent = acctActivities.sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate))[0];
      return daysBetween(mostRecent.activityDate) > cutoff;
    });
    return {
      answer: results.length
        ? `${results.length} customer${results.length === 1 ? "" : "s"} have not been contacted in the last 30 days: ${results.map((a) => a.accountName).join(", ")}.`
        : "All customers have been contacted within the last 30 days.",
      records: results.map(refAccount),
    };
  }

  if (/summarize|summary/.test(q) && /interaction|activity|timeline/.test(q)) {
    const account = db.accounts.find((a) => q.includes(a.accountName.toLowerCase()));
    if (account) {
      const acctActivities = db.activities.filter((a) => a.accountId === account.accountId);
      return { answer: summarizeTimeline(acctActivities), records: [refAccount(account)] };
    }
    return { answer: "Please specify which customer you'd like a summary for.", records: [] };
  }

  if (/at risk|risk/.test(q)) {
    const results = scoped(db.opportunities)
      .filter((o) => o.status === "Open")
      .map((o) => ({ opp: o, risk: detectOpportunityRisk(o) }))
      .filter(({ risk }) => risk.riskLevel === "High");
    return {
      answer: results.length
        ? `${results.length} opportunit${results.length === 1 ? "y is" : "ies are"} at high risk: ${results.map((r) => r.opp.opportunityName).join("; ")}.`
        : "No opportunities are currently flagged as high risk.",
      records: results.map((r) => refOpportunity(r.opp)),
    };
  }

  if (/focus on today|today|prioriti/.test(q)) {
    const myOpps = scoped(db.opportunities).filter((o) => o.status === "Open");
    const risky = myOpps
      .map((o) => ({ opp: o, risk: detectOpportunityRisk(o) }))
      .filter(({ risk }) => risk.riskLevel !== "Low")
      .sort((a, b) => (b.risk.riskLevel === "High" ? 1 : 0) - (a.risk.riskLevel === "High" ? 1 : 0));
    const top = risky.slice(0, 3);
    return {
      answer: top.length
        ? `Focus on: ${top.map((r) => `${r.opp.opportunityName} (${r.risk.riskLevel} risk)`).join("; ")}.`
        : "No urgent items today — pipeline looks healthy.",
      records: top.map((r) => refOpportunity(r.opp)),
    };
  }

  return {
    answer:
      "I can help with questions like: opportunities closing this month, customers not contacted in 30 days, interaction summaries for a customer, opportunities at risk, or what to focus on today.",
    records: [],
  };
}

function refOpportunity(o) {
  return { type: "Opportunity", id: o.opportunityId, label: o.opportunityName, link: `/sales/opportunities/${o.opportunityId}` };
}
function refAccount(a) {
  return { type: "Account", id: a.accountId, label: a.accountName, link: `/customers/accounts/${a.accountId}` };
}
