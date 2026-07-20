export interface Account {
  accountId: string;
  accountName: string;
  industry: string;
  country: string;
  region: string;
  revenue: number;
  employees: number;
  accountManagerId: string;
  accountManagerName?: string;
  customerSegment: string;
  customerStatus: string;
}

export interface Contact {
  contactId: string;
  accountId: string;
  accountName?: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  department: string;
  decisionMakingRole: string;
}

export interface Lead {
  leadId: string;
  companyName: string;
  contactName: string;
  email: string;
  leadSource: string;
  leadStatus: string;
  ownerId: string;
  ownerName?: string;
  createdDate: string;
  industry: string;
  companySize: number;
  engagementScore: number;
  aiScore?: number;
  aiRecommendation?: string;
  aiReasons?: string[];
}

export interface Opportunity {
  opportunityId: string;
  accountId: string;
  accountName?: string;
  opportunityName: string;
  ownerId: string;
  ownerName?: string;
  stage: string;
  estimatedValue: number;
  probability: number;
  expectedCloseDate: string;
  status: string;
  products: string[];
  competitors: string[];
  decisionMakers: string[];
  risks: string[];
  nextAction: string;
  weightedRevenue?: number;
  riskLevel?: string;
}

export interface Activity {
  activityId: string;
  accountId: string;
  accountName?: string;
  opportunityId: string | null;
  opportunityName?: string | null;
  activityType: string;
  subject: string;
  description: string;
  activityDate: string;
  ownerId: string;
  ownerName?: string;
}

export interface Product {
  productId: string;
  productName: string;
  category: string;
  price: number;
}

export interface SalesUser {
  userId: string;
  name: string;
  role: string;
  region: string;
}

export interface SalesTarget {
  targetId: string;
  salesPersonId: string;
  period: string;
  targetAmount: number;
}

export interface Customer360 {
  account: Account;
  contacts: Contact[];
  opportunities: Opportunity[];
  activities: Activity[];
  productsPurchased: Product[];
  documents: unknown[];
  openSupportIssues: unknown[];
  aiSummary: CustomerSummary;
}

export interface CustomerSummary {
  accountId: string;
  accountName: string;
  accountManager: string;
  industry: string;
  region: string;
  openOpportunities: number;
  pipelineValue: number;
  wonBusiness: number;
  openActivities: number;
  customerHealth: string;
  aiInsight: string;
}

export interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  weightedValue: number;
}

export interface Forecast {
  salesTarget: number;
  totalPipeline: number;
  weightedPipeline: number;
  committed: number;
  bestCase: number;
  closedWon: number;
  aiHighlight: string;
  staleHighValueOpportunities: { id: string; name: string }[];
}

export interface DashboardData {
  kpis: {
    totalAccounts: number;
    openOpportunities: number;
    totalPipeline: number;
    weightedPipeline: number;
    salesTarget: number;
    closedWon: number;
    openLeads: number;
    staleAccounts: number;
  };
  leadsByStatus: { status: string; count: number }[];
  riskyOpportunities: { opportunityId: string; opportunityName: string; accountId: string; summary: string }[];
  aiHighlight: string;
}

export interface LeadScore {
  leadId: string;
  score: number;
  recommendation: string;
  reasons: string[];
}

export interface OpportunityRisk {
  opportunityId: string;
  riskLevel: string;
  reasons: string[];
  summary: string;
}

export interface NextBestAction {
  opportunityId: string;
  riskLevel: string;
  actions: string[];
}

export interface AuditRecord {
  auditId: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedDate: string;
}

export interface QueryResult {
  answer: string;
  records: { type: string; id: string; label: string; link: string }[];
}
