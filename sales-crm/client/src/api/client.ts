import type {
  Account,
  Activity,
  Contact,
  ConvertLeadResult,
  DashboardSummary,
  Lead,
  Opportunity,
  StageMeta,
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
  // Leads
  listLeads: (params?: Record<string, string>) => request<Lead[]>(`/leads${qs(params)}`),
  getLead: (id: string) => request<Lead>(`/leads/${id}`),
  createLead: (data: Partial<Lead>) => request<Lead>("/leads", { method: "POST", body: JSON.stringify(data) }),
  updateLead: (id: string, data: Partial<Lead>) => request<Lead>(`/leads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  changeLeadStatus: (id: string, status: string, owner?: string, note?: string) =>
    request<Lead>(`/leads/${id}/status`, { method: "POST", body: JSON.stringify({ status, owner, note }) }),
  convertLead: (id: string, data: Record<string, unknown>) =>
    request<ConvertLeadResult>(`/leads/${id}/convert`, { method: "POST", body: JSON.stringify(data) }),
  leadSources: () => request<{ sources: string[] }>("/leads/meta"),

  // Accounts
  listAccounts: (params?: Record<string, string>) => request<Account[]>(`/accounts${qs(params)}`),
  getAccount: (id: string) => request<Account>(`/accounts/${id}`),
  createAccount: (data: Partial<Account>) => request<Account>("/accounts", { method: "POST", body: JSON.stringify(data) }),
  updateAccount: (id: string, data: Partial<Account>) => request<Account>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  industries: () => request<{ industries: string[] }>("/accounts/meta"),

  // Contacts
  listContacts: (params?: Record<string, string>) => request<Contact[]>(`/contacts${qs(params)}`),
  getContact: (id: string) => request<Contact>(`/contacts/${id}`),
  createContact: (data: Partial<Contact>) => request<Contact>("/contacts", { method: "POST", body: JSON.stringify(data) }),
  updateContact: (id: string, data: Partial<Contact>) => request<Contact>(`/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Opportunities
  listOpportunities: (params?: Record<string, string>) => request<Opportunity[]>(`/opportunities${qs(params)}`),
  getOpportunity: (id: string) => request<Opportunity>(`/opportunities/${id}`),
  createOpportunity: (data: Partial<Opportunity>) => request<Opportunity>("/opportunities", { method: "POST", body: JSON.stringify(data) }),
  updateOpportunity: (id: string, data: Partial<Opportunity>) => request<Opportunity>(`/opportunities/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  changeOpportunityStage: (id: string, stage: string, owner?: string, note?: string, amount?: number) =>
    request<Opportunity>(`/opportunities/${id}/stage`, { method: "POST", body: JSON.stringify({ stage, owner, note, amount }) }),
  opportunityStages: () => request<{ stages: StageMeta[] }>("/opportunities/meta"),

  // Activities
  listActivities: (relatedType: string, relatedId: string) =>
    request<Activity[]>(`/activities${qs({ relatedType, relatedId })}`),
  createActivity: (data: Partial<Activity>) => request<Activity>("/activities", { method: "POST", body: JSON.stringify(data) }),
  activityTypes: () => request<{ types: string[] }>("/activities/meta"),

  // Dashboard
  dashboardSummary: () => request<DashboardSummary>("/dashboard/summary"),
  owners: () => request<string[]>("/dashboard/owners"),
};

function qs(params?: Record<string, string>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}
