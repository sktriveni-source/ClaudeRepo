import type {
  AiAnswer,
  AuditEntry,
  Customer360,
  CrmAccount,
  CrmActivity,
  CrmContact,
  CrmDashboard,
  CrmForecast,
  CrmLead,
  CrmOpportunity,
  MdmDashboard,
  MdmIssue,
  MdmRecord,
  MdmRule,
  MdmSource,
  PipelineStage,
  PlmChangeRequest,
  PlmDashboard,
  PlmDocument,
  PlmProduct,
} from "../types";

const BASE = "/api";

/** Update payloads may carry an optional changedBy for the server-side audit log. */
type Editable<T> = Partial<T> & { changedBy?: string };

class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiRequestError(body.error || "Request failed", res.status);
  }
  return body as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) });
const put = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(data ?? {}) });

export { ApiRequestError };

export function getHealth() {
  return get<{ status: string; aiEnabled: boolean }>("/health");
}

// ---- PLM ----

export const plmApi = {
  dashboard: () => get<PlmDashboard>("/plm/dashboard"),
  listProducts: (params: Record<string, string> = {}) =>
    get<PlmProduct[]>(`/plm/products?${new URLSearchParams(params)}`),
  getProduct: (id: string) => get<PlmProduct>(`/plm/products/${id}`),
  createProduct: (data: Editable<PlmProduct>) => post<PlmProduct>("/plm/products", data),
  updateProduct: (id: string, data: Editable<PlmProduct>) => put<PlmProduct>(`/plm/products/${id}`, data),
  listDocuments: (productId: string) => get<PlmDocument[]>(`/plm/products/${productId}/documents`),
  createDocument: (productId: string, data: Editable<PlmDocument>) =>
    post<PlmDocument>(`/plm/products/${productId}/documents`, data),
  qualityRecommendations: (productId: string) =>
    get<{ recommendations: string[] }>(`/plm/products/${productId}/quality-recommendations`),
  listChangeRequests: (params: Record<string, string> = {}) =>
    get<PlmChangeRequest[]>(`/plm/change-requests?${new URLSearchParams(params)}`),
  createChangeRequest: (data: Editable<PlmChangeRequest>) => post<PlmChangeRequest>("/plm/change-requests", data),
  updateChangeRequest: (id: string, data: Editable<PlmChangeRequest>) =>
    put<PlmChangeRequest>(`/plm/change-requests/${id}`, data),
  audit: (entityId?: string) => get<AuditEntry[]>(`/plm/audit${entityId ? `?entityId=${entityId}` : ""}`),
  aiSearch: (query: string) => post<{ results: any[] }>("/plm/ai/search", { query }),
  aiQuery: (question: string) => post<AiAnswer>("/plm/ai/query", { question }),
  summarizeDocument: (documentId: string) => post<{ summary: string; source: string }>("/plm/ai/summarize-document", { documentId }),
  duplicates: () => get<{ candidates: any[] }>("/plm/ai/duplicates"),
};

// ---- MDM ----

export const mdmApi = {
  dashboard: () => get<MdmDashboard>("/mdm/dashboard"),
  listSources: () => get<MdmSource[]>("/mdm/sources"),
  listRecords: (params: Record<string, string> = {}) => get<MdmRecord[]>(`/mdm/records?${new URLSearchParams(params)}`),
  getRecord: (id: string) => get<MdmRecord>(`/mdm/records/${id}`),
  listRules: () => get<MdmRule[]>("/mdm/rules"),
  updateRule: (id: string, data: Editable<MdmRule>) => put<MdmRule>(`/mdm/rules/${id}`, data),
  listIssues: (params: Record<string, string> = {}) => get<MdmIssue[]>(`/mdm/issues?${new URLSearchParams(params)}`),
  updateIssue: (id: string, data: Editable<MdmIssue>) => put<MdmIssue>(`/mdm/issues/${id}`, data),
  aiDuplicates: () => get<{ candidates: any[] }>("/mdm/ai/duplicates"),
  aiCleansingSuggestions: (recordId: string) =>
    post<{ suggestions: string[]; source: string }>("/mdm/ai/cleansing-suggestions", { recordId }),
  aiQuery: (question: string) => post<AiAnswer>("/mdm/ai/query", { question }),
};

// ---- CRM ----

export const crmApi = {
  dashboard: () => get<CrmDashboard>("/crm/dashboard"),
  pipeline: () => get<{ stages: PipelineStage[] }>("/crm/opportunities/pipeline"),
  forecast: () => get<CrmForecast>("/crm/opportunities/forecast"),
  listAccounts: (params: Record<string, string> = {}) => get<CrmAccount[]>(`/crm/accounts?${new URLSearchParams(params)}`),
  getAccount: (id: string) => get<CrmAccount>(`/crm/accounts/${id}`),
  customer360: (id: string) => get<Customer360>(`/crm/accounts/${id}/customer360`),
  accountActivities: (id: string) => get<CrmActivity[]>(`/crm/accounts/${id}/activities`),
  listContacts: (accountId?: string) => get<CrmContact[]>(`/crm/contacts${accountId ? `?accountId=${accountId}` : ""}`),
  listLeads: (params: Record<string, string> = {}) => get<CrmLead[]>(`/crm/leads?${new URLSearchParams(params)}`),
  getLead: (id: string) => get<CrmLead>(`/crm/leads/${id}`),
  qualifyLead: (id: string) => post<CrmLead>(`/crm/leads/${id}/qualify`),
  convertLead: (id: string, data: Partial<{ estimatedValue: number; country: string; region: string }> = {}) =>
    post<{ lead: CrmLead; account: CrmAccount; contact: CrmContact; opportunity: CrmOpportunity }>(
      `/crm/leads/${id}/convert`,
      data
    ),
  createLead: (data: Editable<CrmLead>) => post<CrmLead>("/crm/leads", data),
  listOpportunities: (params: Record<string, string> = {}) =>
    get<CrmOpportunity[]>(`/crm/opportunities?${new URLSearchParams(params)}`),
  getOpportunity: (id: string) => get<CrmOpportunity>(`/crm/opportunities/${id}`),
  updateOpportunity: (id: string, data: Editable<CrmOpportunity>) => put<CrmOpportunity>(`/crm/opportunities/${id}`, data),
  createOpportunity: (data: Editable<CrmOpportunity>) => post<CrmOpportunity>("/crm/opportunities", data),
  listActivities: (params: Record<string, string> = {}) => get<CrmActivity[]>(`/crm/activities?${new URLSearchParams(params)}`),
  createActivity: (data: Editable<CrmActivity>) => post<CrmActivity>("/crm/activities", data),
  aiQuery: (question: string, owner?: string) => post<AiAnswer>("/crm/ai/query", { question, owner }),
};
