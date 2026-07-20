import type {
  Account,
  Activity,
  AuditRecord,
  Contact,
  Customer360,
  DashboardData,
  Forecast,
  Lead,
  LeadScore,
  NextBestAction,
  Opportunity,
  OpportunityRisk,
  PipelineStage,
  Product,
  QueryResult,
  SalesTarget,
  SalesUser,
} from "../types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getDashboard: () => request<DashboardData>("/dashboard"),

  getAccounts: (params?: Record<string, string>) =>
    request<Account[]>(`/accounts${qs(params)}`),
  getAccount: (id: string) => request<Account>(`/accounts/${id}`),
  getCustomer360: (id: string) => request<Customer360>(`/accounts/${id}/customer360`),
  createAccount: (data: Partial<Account>) => request<Account>("/accounts", { method: "POST", body: JSON.stringify(data) }),
  updateAccount: (id: string, data: Partial<Account>) => request<Account>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getContacts: (params?: Record<string, string>) => request<Contact[]>(`/contacts${qs(params)}`),
  createContact: (data: Partial<Contact>) => request<Contact>("/contacts", { method: "POST", body: JSON.stringify(data) }),

  getLeads: (params?: Record<string, string>) => request<Lead[]>(`/leads${qs(params)}`),
  getLead: (id: string) => request<Lead>(`/leads/${id}`),
  createLead: (data: Partial<Lead>) => request<Lead>("/leads", { method: "POST", body: JSON.stringify(data) }),
  updateLead: (id: string, data: Partial<Lead>) => request<Lead>(`/leads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  qualifyLead: (id: string, qualified: boolean) =>
    request<Lead>(`/leads/${id}/qualify`, { method: "POST", body: JSON.stringify({ qualified }) }),
  convertLead: (id: string, data?: Record<string, unknown>) =>
    request<{ lead: Lead; account: Account; contact: Contact; opportunity: Opportunity }>(`/leads/${id}/convert`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  getOpportunities: (params?: Record<string, string>) => request<Opportunity[]>(`/opportunities${qs(params)}`),
  getOpportunity: (id: string) => request<Opportunity>(`/opportunities/${id}`),
  createOpportunity: (data: Partial<Opportunity>) =>
    request<Opportunity>("/opportunities", { method: "POST", body: JSON.stringify(data) }),
  updateOpportunity: (id: string, data: Partial<Opportunity>) =>
    request<Opportunity>(`/opportunities/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getPipeline: (params?: Record<string, string>) => request<PipelineStage[]>(`/opportunities/pipeline${qs(params)}`),
  getForecast: (params?: Record<string, string>) => request<Forecast>(`/opportunities/forecast${qs(params)}`),

  getActivities: (params?: Record<string, string>) => request<Activity[]>(`/activities${qs(params)}`),
  createActivity: (data: Partial<Activity>) => request<Activity>("/activities", { method: "POST", body: JSON.stringify(data) }),

  getProducts: () => request<Product[]>("/products"),
  getSalesUsers: () => request<SalesUser[]>("/sales-users"),
  getSalesTargets: (params?: Record<string, string>) => request<SalesTarget[]>(`/sales-targets${qs(params)}`),
  getAudit: () => request<AuditRecord[]>("/audit"),

  aiCustomerSummary: (accountId: string) =>
    request<unknown>("/ai/customer-summary", { method: "POST", body: JSON.stringify({ accountId }) }),
  aiLeadScore: (leadId: string) => request<LeadScore>("/ai/lead-score", { method: "POST", body: JSON.stringify({ leadId }) }),
  aiOpportunityRisk: (opportunityId: string) =>
    request<OpportunityRisk>("/ai/opportunity-risk", { method: "POST", body: JSON.stringify({ opportunityId }) }),
  aiNextBestAction: (opportunityId: string) =>
    request<NextBestAction>("/ai/next-best-action", { method: "POST", body: JSON.stringify({ opportunityId }) }),
  aiQuery: (question: string, ownerId?: string) =>
    request<QueryResult>("/ai/query", { method: "POST", body: JSON.stringify({ question, ownerId }) }),
};

function qs(params?: Record<string, string>): string {
  if (!params) return "";
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (filtered.length === 0) return "";
  return `?${new URLSearchParams(filtered).toString()}`;
}
