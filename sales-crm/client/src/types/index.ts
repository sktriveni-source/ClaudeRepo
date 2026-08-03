export type LeadStatus = "New" | "Nurturing" | "Converted" | "Disqualified";

export type OpportunityStage =
  | "Opportunity"
  | "Qualify"
  | "Proposal"
  | "Negotiation"
  | "Contract"
  | "Execute"
  | "Closed Won"
  | "Closed Lost";

export interface StageMeta {
  key: string;
  label: string;
  order: number;
  probability?: number;
  terminal?: boolean;
  won?: boolean;
}

export interface PipelineStep {
  key: string;
  label: string;
}

export interface Activity {
  id: string;
  relatedType: "Lead" | "Account" | "Contact" | "Opportunity";
  relatedId: string;
  type: string;
  subject: string;
  description: string;
  owner: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  rating: string;
  owner: string;
  notes: string;
  convertedAccountId: string | null;
  convertedContactId: string | null;
  convertedOpportunityId: string | null;
  createdAt: string;
  updatedAt: string;
  activities?: Activity[];
}

export interface Account {
  id: string;
  name: string;
  industry: string;
  website: string;
  phone: string;
  billingCity: string;
  billingCountry: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  contacts?: Contact[];
  opportunities?: Opportunity[];
  activities?: Activity[];
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  accountId: string | null;
  leadSource: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  account?: Account | null;
  opportunities?: Opportunity[];
  activities?: Activity[];
}

export interface Opportunity {
  id: string;
  name: string;
  accountId: string;
  contactId: string | null;
  amount: number;
  currency: string;
  stage: OpportunityStage;
  probability: number;
  closeDate: string | null;
  owner: string;
  sourceLeadId: string | null;
  createdAt: string;
  updatedAt: string;
  account?: Account | null;
  contact?: Contact | null;
  activities?: Activity[];
}

export interface DashboardSummary {
  totals: {
    leads: number;
    openLeads: number;
    accounts: number;
    contacts: number;
    opportunities: number;
    openOpportunities: number;
    pipelineValue: number;
    weightedPipelineValue: number;
    wonValue: number;
    winRate: number;
    leadConversionRate: number;
  };
  stageCounts: Record<string, number>;
  recentActivity: Activity[];
  pipelineSteps: PipelineStep[];
}

export interface ConvertLeadResult {
  lead: Lead;
  account: Account;
  contact: Contact;
  opportunity: Opportunity;
}
