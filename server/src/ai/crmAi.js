import { generateText, withAiFallback } from "./aiClient.js";

const TARGET_INDUSTRIES = new Set(["Technology", "Manufacturing", "Financial Services", "Energy", "Healthcare"]);
const SOURCE_TRUST = { Referral: 20, Partner: 20, Webinar: 14, Website: 10, "Trade Show": 12, "Cold Outreach": 4 };
const SIZE_POINTS = { "5000+": 20, "1000-5000": 16, "500-1000": 10, "100-500": 5 };

/** Deterministic lead score per the spec's formula: profile + industry + size + engagement + conversion patterns. */
export function scoreLead(lead) {
  const engagementPoints = Math.round((lead.engagementScore || 0) * 0.4); // up to 40
  const industryPoints = TARGET_INDUSTRIES.has(lead.industry) ? 22 : 8; // up to 22
  const sizePoints = SIZE_POINTS[lead.companySize] ?? 5; // up to 20
  const sourcePoints = SOURCE_TRUST[lead.leadSource] ?? 6; // up to 20, acts as conversion-pattern proxy
  const total = Math.min(100, engagementPoints + industryPoints + sizePoints + sourcePoints);

  const reasons = [];
  if (lead.engagementScore >= 70) reasons.push("Strong engagement signals");
  if (TARGET_INDUSTRIES.has(lead.industry)) reasons.push(`Target industry (${lead.industry})`);
  if (SIZE_POINTS[lead.companySize] >= 16) reasons.push("Appropriate company size");
  if (SOURCE_TRUST[lead.leadSource] >= 14) reasons.push(`High-converting source (${lead.leadSource})`);
  if (reasons.length === 0) reasons.push("Limited positive signals detected so far");

  const recommendation = total >= 75 ? "High-priority lead" : total >= 50 ? "Medium-priority lead" : "Low-priority lead";

  return { score: total, recommendation, reasons };
}

/** Deterministic opportunity risk rules per the spec: stale activity, no decision maker, competitor, close-date pressure. */
export function assessOpportunityRisk(opp) {
  const factors = [];
  const daysSinceActivity = Math.floor((Date.now() - new Date(opp.lastActivityDate).getTime()) / 86400000);
  const daysToClose = Math.floor((new Date(opp.expectedCloseDate).getTime() - Date.now()) / 86400000);

  if (daysSinceActivity > 30) factors.push(`No customer interaction recorded for ${daysSinceActivity} days`);
  if (!opp.decisionMakers || opp.decisionMakers.length === 0) factors.push("No identified decision maker");
  if (opp.competitors && opp.competitors.length > 0) factors.push(`Competitor involvement: ${opp.competitors.join(", ")}`);
  if (opp.stage === "Proposal" && daysSinceActivity > 14) factors.push("Proposal has been pending too long with no follow-up");
  if (daysToClose <= 14 && daysToClose >= 0 && (factors.length > 0 || !opp.decisionMakers?.length)) {
    factors.push(`Expected close date is in ${daysToClose} days`);
  }
  if (daysToClose < 0 && opp.status === "Open") factors.push("Expected close date has already passed");

  let level = "Low";
  if (factors.length >= 3) level = "Critical";
  else if (factors.length === 2) level = "High";
  else if (factors.length === 1) level = "Medium";

  return { level, factors, daysSinceActivity, daysToClose };
}

export function weightedPipeline(opportunities) {
  return opportunities
    .filter((o) => o.status === "Open")
    .reduce((sum, o) => sum + o.estimatedValue * (o.probability / 100), 0);
}

function heuristicCustomerSummary(account, opportunities, activities) {
  const open = opportunities.filter((o) => o.accountId === account.id && o.status === "Open");
  const won = opportunities.filter((o) => o.accountId === account.id && o.status === "Won");
  const pipelineValue = open.reduce((s, o) => s + o.estimatedValue, 0);
  const wonValue = won.reduce((s, o) => s + o.estimatedValue, 0);
  const recentActivities = activities
    .filter((a) => a.accountId === account.id)
    .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  const closingSoon = open.filter((o) => {
    const days = Math.floor((new Date(o.expectedCloseDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 30;
  });
  let summary = `${account.accountName} has ${open.length} open opportunit${open.length === 1 ? "y" : "ies"} worth $${pipelineValue.toLocaleString()} in pipeline`;
  if (closingSoon.length > 0) {
    summary += `, with ${closingSoon.length} approaching their expected close date within 30 days`;
  }
  summary += `. Won business to date totals $${wonValue.toLocaleString()}.`;
  if (recentActivities.length > 0) {
    summary += ` Most recent activity: "${recentActivities[0].subject}".`;
  }
  return { summary };
}

export async function customerSummary(account, opportunities, activities) {
  return withAiFallback(
    async () => {
      const open = opportunities.filter((o) => o.accountId === account.id && o.status === "Open");
      const won = opportunities.filter((o) => o.accountId === account.id && o.status === "Won");
      const recent = activities
        .filter((a) => a.accountId === account.id)
        .sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate))
        .slice(0, 5);
      const context = JSON.stringify(
        {
          account: account.accountName,
          industry: account.industry,
          region: account.region,
          customerStatus: account.customerStatus,
          openOpportunities: open.map((o) => ({ name: o.opportunityName, value: o.estimatedValue, stage: o.stage, closeDate: o.expectedCloseDate })),
          wonOpportunities: won.map((o) => o.opportunityName),
          recentActivity: recent.map((a) => ({ date: a.activityDate, subject: a.subject, type: a.activityType })),
        },
        null,
        2
      );
      const text = await generateText({
        system:
          "You write a 2-4 sentence 'Customer 360' AI insight for a sales rep, summarizing account health, notable open opportunities, and any timing signals (approaching close dates, recent product interest). Base it only on the JSON provided.",
        prompt: context,
        maxTokens: 400,
      });
      return { summary: text.trim() };
    },
    () => heuristicCustomerSummary(account, opportunities, activities)
  );
}

export function nextBestActions(opp, risk) {
  const actions = [];
  if (risk.factors.some((f) => f.includes("decision maker"))) actions.push("Engage decision maker");
  if (risk.factors.some((f) => f.includes("interaction"))) actions.push("Schedule customer meeting");
  if (opp.stage === "Proposal") actions.push("Follow up on proposal");
  if (opp.stage === "Negotiation") actions.push("Escalate commercial approval");
  if (risk.daysToClose >= 0 && risk.daysToClose <= 14) actions.push("Update or confirm opportunity close date");
  if (opp.competitors && opp.competitors.length > 0) actions.push("Prepare competitive differentiation talking points");
  if (actions.length === 0) actions.push("Continue standard cadence — no urgent action required");
  return [...new Set(actions)];
}

function heuristicAssistantAnswer(question, ctx) {
  const q = question.toLowerCase();
  const { opportunities, accounts, activities, owner } = ctx;
  const mine = owner ? opportunities.filter((o) => o.owner === owner) : opportunities;

  if (q.includes("closing this month")) {
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
    const results = mine.filter((o) => o.status === "Open" && new Date(o.expectedCloseDate) <= endOfMonth);
    return {
      answer:
        results.length > 0
          ? `You have ${results.length} opportunity(ies) closing this month: ${results.map((o) => `${o.opportunityName} ($${o.estimatedValue.toLocaleString()})`).join(", ")}.`
          : "No opportunities are closing this month.",
      records: results,
    };
  }
  if (q.includes("not been contacted") || q.includes("no activity") || q.includes("not contacted")) {
    const cutoff = Date.now() - 30 * 86400000;
    const results = accounts.filter((a) => {
      const last = activities
        .filter((act) => act.accountId === a.id)
        .sort((x, y) => new Date(y.activityDate) - new Date(x.activityDate))[0];
      return !last || new Date(last.activityDate).getTime() < cutoff;
    });
    return {
      answer:
        results.length > 0
          ? `${results.length} customer(s) have not been contacted in the last 30 days: ${results.map((a) => a.accountName).join(", ")}.`
          : "All customers have been contacted within the last 30 days.",
      records: results,
    };
  }
  if (q.includes("at risk")) {
    return { answer: "Check the Opportunity Risk view for a full breakdown of at-risk opportunities.", records: [] };
  }
  return {
    answer: "I can help with opportunities closing soon, customers needing follow-up, opportunity risk, and account summaries. Try asking one of those.",
    records: [],
  };
}

export async function assistantQuery(question, ctx) {
  return withAiFallback(
    async () => {
      const { opportunities, accounts, activities, owner } = ctx;
      const mine = owner ? opportunities.filter((o) => o.owner === owner) : opportunities;
      const context = JSON.stringify(
        {
          currentUser: owner || "unspecified",
          myOpenOpportunities: mine
            .filter((o) => o.status === "Open")
            .map((o) => ({ name: o.opportunityName, value: o.estimatedValue, stage: o.stage, closeDate: o.expectedCloseDate, lastActivity: o.lastActivityDate })),
          accountsSummary: accounts.map((a) => ({ name: a.accountName, status: a.customerStatus })),
        },
        null,
        2
      );
      const text = await generateText({
        system:
          "You are the AI Sales Assistant inside a CRM. Answer the rep's natural-language question using ONLY the JSON CRM context given — reference specific opportunity/account names. Keep it to 2-4 sentences, and end with a suggested next step when relevant.",
        prompt: `Question: ${question}\n\nCRM context:\n${context}`,
        maxTokens: 500,
      });
      return { answer: text.trim(), records: [] };
    },
    () => heuristicAssistantAnswer(question, ctx)
  );
}
