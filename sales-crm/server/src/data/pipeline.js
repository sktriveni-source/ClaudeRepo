// Sales lifecycle definition, modeled on the Salesforce Lead -> Opportunity flow:
//
//   Lead/Engagement -> Nurture Lead -> [convert] -> Opportunity -> Qualify ->
//   Proposal -> Negotiation -> Contract -> Execute -> Closure (Won/Lost)
//
// A Lead progresses through LEAD_STATUSES until it is converted, at which
// point an Account, Contact and Opportunity are created and the deal
// continues through OPPORTUNITY_STAGES.

export const LEAD_STATUSES = [
  { key: "New", label: "Lead / Engagement", order: 1 },
  { key: "Nurturing", label: "Nurture Lead", order: 2 },
  { key: "Converted", label: "Converted", order: 3, terminal: true },
  { key: "Disqualified", label: "Disqualified", order: 3, terminal: true },
];

export const OPPORTUNITY_STAGES = [
  { key: "Opportunity", label: "Opportunity", order: 3, probability: 10 },
  { key: "Qualify", label: "Qualify", order: 4, probability: 20 },
  { key: "Proposal", label: "Proposal", order: 5, probability: 40 },
  { key: "Negotiation", label: "Negotiation", order: 6, probability: 60 },
  { key: "Contract", label: "Contract", order: 7, probability: 80 },
  { key: "Execute", label: "Execute", order: 8, probability: 90 },
  { key: "Closed Won", label: "Closure – Won", order: 9, probability: 100, terminal: true, won: true },
  { key: "Closed Lost", label: "Closure – Lost", order: 9, probability: 0, terminal: true, won: false },
];

export const OPEN_OPPORTUNITY_STAGES = OPPORTUNITY_STAGES.filter((s) => !s.terminal).map((s) => s.key);

// The unified 9-step visual pipeline used by the dashboard funnel, spanning
// both the Lead and Opportunity objects.
export const PIPELINE_STEPS = [
  { key: "Lead", label: "Lead / Engagement" },
  { key: "Nurturing", label: "Nurture Lead" },
  { key: "Opportunity", label: "Opportunity" },
  { key: "Qualify", label: "Qualify" },
  { key: "Proposal", label: "Proposal" },
  { key: "Negotiation", label: "Negotiation" },
  { key: "Contract", label: "Contract" },
  { key: "Execute", label: "Execute" },
  { key: "Closure", label: "Closure" },
];

export const LEAD_SOURCES = [
  "Web",
  "Referral",
  "Trade Show",
  "Cold Call",
  "Partner",
  "Advertisement",
  "Social Media",
  "Email Campaign",
];

export const INDUSTRIES = [
  "Technology",
  "Manufacturing",
  "Financial Services",
  "Healthcare",
  "Retail",
  "Education",
  "Energy",
  "Telecommunications",
];

export const ACTIVITY_TYPES = ["Call", "Email", "Meeting", "Note", "StatusChange", "StageChange", "Conversion"];

export const OWNERS = ["Priya Sharma", "Arjun Mehta", "Kavya Rao", "Rahul Nair", "Sneha Iyer"];

export function leadStatusMeta(status) {
  return LEAD_STATUSES.find((s) => s.key === status);
}

export function opportunityStageMeta(stage) {
  return OPPORTUNITY_STAGES.find((s) => s.key === stage);
}
