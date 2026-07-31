// ---- PLM ----

export interface PlmProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  lifecycleStage: "Concept" | "Active" | "Phase-Out" | "End of Life";
  owner: string;
  complianceStatus: string;
  version: string;
  description: string;
  tags: string[];
  createdDate: string;
  updatedDate: string;
}

export interface PlmDocument {
  id: string;
  productId: string;
  title: string;
  type: string;
  version: string;
  status: string;
  uploadedBy: string;
  content: string;
  summary?: string;
  createdDate: string;
  updatedDate: string;
}

export interface PlmChangeRequest {
  id: string;
  productId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  requestedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface PlmDashboard {
  totalProducts: number;
  totalDocuments: number;
  openChangeRequests: number;
  lifecycleBreakdown: Record<string, number>;
  productsNeedingAttention: { id: string; name: string; lifecycleStage: string }[];
  complianceReviewNeeded: number;
  aiEnabled: boolean;
}

// ---- MDM ----

export interface MdmSource {
  id: string;
  name: string;
  type: string;
  connectionStatus: string;
  recordCount: number;
  lastProfiled: string;
}

export interface MdmRecord {
  id: string;
  sourceId: string;
  entityType: "Customer" | "Supplier" | "Product";
  attributes: Record<string, string | number | null>;
  issues: string[];
  qualityScore?: number;
  createdDate: string;
  updatedDate: string;
}

export interface MdmRule {
  id: string;
  name: string;
  field: string;
  entityType: string;
  ruleType: string;
  severity: string;
  active: boolean;
}

export interface MdmIssue {
  id: string;
  recordId: string;
  entityType: string;
  type: string;
  description: string;
  status: string;
  severity: string;
  assignedTo: string | null;
  record?: MdmRecord;
}

export interface MdmDashboard {
  totalSources: number;
  totalRecords: number;
  averageQualityScore: number;
  recordsByEntityType: Record<string, number>;
  issueBreakdown: Record<string, number>;
  openIssues: number;
  aiEnabled: boolean;
}

// ---- CRM ----

export interface CrmAccount {
  id: string;
  accountName: string;
  industry: string;
  country: string;
  region: string;
  revenue: number;
  employees: number;
  accountManagerId: string;
  accountManager: string;
  customerSegment: string;
  customerStatus: string;
}

export interface CrmContact {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  department: string;
  decisionMaker: boolean;
}

export interface CrmLead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  leadSource: string;
  leadStatus: string;
  ownerId: string;
  owner: string;
  industry: string;
  companySize: string;
  engagementScore: number;
  aiScore?: { score: number; recommendation: string; reasons: string[] };
}

export interface CrmOpportunity {
  id: string;
  opportunityName: string;
  accountId: string;
  ownerId: string;
  owner: string;
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
  lastActivityDate: string;
  weightedRevenue?: number;
  risk?: OpportunityRisk;
  nextBestActions?: string[];
  activities?: CrmActivity[];
}

export interface OpportunityRisk {
  level: "Low" | "Medium" | "High" | "Critical";
  factors: string[];
  daysSinceActivity: number;
  daysToClose: number;
}

export interface CrmActivity {
  id: string;
  accountId: string;
  opportunityId: string | null;
  activityType: string;
  subject: string;
  description: string;
  activityDate: string;
  ownerId: string;
  owner: string;
}

export interface CrmDashboard {
  totalAccounts: number;
  totalLeads: number;
  openOpportunities: number;
  totalPipeline: number;
  weightedPipeline: number;
  closedWon: number;
  salesTarget: number;
  aiEnabled: boolean;
}

export interface CrmForecast {
  salesTarget: number;
  totalPipeline: number;
  weightedPipeline: number;
  committed: number;
  bestCase: number;
  closedWon: number;
}

export interface PipelineStage {
  stage: string;
  value: number;
  count: number;
}

export interface Customer360 {
  account: CrmAccount;
  contacts: CrmContact[];
  openOpportunities: CrmOpportunity[];
  wonOpportunities: CrmOpportunity[];
  pipelineValue: number;
  wonValue: number;
  openActivitiesCount: number;
  recentActivities: CrmActivity[];
  aiInsight: string;
  aiInsightSource: string;
}

// ---- Shared ----

export interface AiAnswer {
  answer: string;
  matches?: unknown[];
  records?: unknown[];
  source: string;
}

export interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changedBy: string;
  oldValue: unknown;
  newValue: unknown;
  changedDate: string;
}
