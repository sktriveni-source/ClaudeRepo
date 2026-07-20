import type {
  Approval,
  DashboardSummary,
  DataSource,
  Domain,
  DomainProfile,
  DomainQualityScore,
  DuplicateCluster,
  FieldMappingSuggestion,
  Issue,
  MdmRecord,
  NlQueryResult,
  ValidationRule,
} from "../types";

function toQueryString(params?: Record<string, string | undefined>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries as [string, string][]).toString()}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  dashboard: () => request<DashboardSummary>("/dashboard/summary"),

  dataSources: () => request<DataSource[]>("/data-sources"),
  addDataSource: (payload: Partial<DataSource>) =>
    request<DataSource>("/data-sources", { method: "POST", body: JSON.stringify(payload) }),
  syncDataSource: (id: string) => request<DataSource>(`/data-sources/${id}/sync`, { method: "POST" }),

  records: (domain: Domain, params?: { q?: string; sourceId?: string }) =>
    request<MdmRecord[]>(`/records/${domain}${toQueryString(params)}`),

  profile: (domain: Domain) => request<DomainProfile>(`/profiling/${domain}`),

  rules: (domain?: Domain) => request<ValidationRule[]>(`/rules${domain ? `?domain=${domain}` : ""}`),
  createRule: (rule: Partial<ValidationRule>) => request<ValidationRule>("/rules", { method: "POST", body: JSON.stringify(rule) }),
  deleteRule: (id: string) => request<void>(`/rules/${id}`, { method: "DELETE" }),
  ruleFromText: (text: string) => request<{ understood: boolean; rule?: Partial<ValidationRule>; message?: string }>("/rules/from-text", {
    method: "POST",
    body: JSON.stringify({ text }),
  }),

  runValidation: (domain: Domain) => request<{ domain: Domain; issuesCreated: number }>(`/validation/run/${domain}`, { method: "POST" }),

  duplicates: (domain: Domain) => request<DuplicateCluster[]>(`/duplicates/${domain}`),
  runDuplicateScan: (domain: Domain) => request<DuplicateCluster[]>(`/duplicates/${domain}/run`, { method: "POST" }),
  resolveCluster: (domain: Domain, clusterId: string, action: "merge" | "reject") =>
    request<Approval>(`/duplicates/${domain}/${clusterId}/resolve`, { method: "POST", body: JSON.stringify({ action }) }),

  issues: (params?: { domain?: Domain; status?: string; severity?: string; category?: string }) =>
    request<Issue[]>(`/issues${toQueryString(params)}`),
  updateIssue: (id: string, patch: Partial<Issue>) => request<Issue>(`/issues/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  requestFix: (id: string) => request<Approval>(`/issues/${id}/request-fix`, { method: "POST" }),
  issueSuggestion: (id: string) =>
    request<{ action: string; suggestion: string; suggestedValue?: unknown; field?: string }>(`/issues/${id}/suggestion`),

  approvals: (status?: string) => request<Approval[]>(`/approvals${status ? `?status=${status}` : ""}`),
  decideApproval: (id: string, decision: "approve" | "reject", comment?: string) =>
    request<Approval>(`/approvals/${id}`, { method: "PATCH", body: JSON.stringify({ decision, comment }) }),

  qualityScores: () => request<{ overall: number; domains: DomainQualityScore[] }>("/quality-scores"),
  qualityScore: (domain: Domain) => request<DomainQualityScore>(`/quality-scores/${domain}`),

  nlQuery: (query: string) => request<NlQueryResult>("/ai/nl-query", { method: "POST", body: JSON.stringify({ query }) }),
  fieldMapping: (domain: Domain, rawFields: string[]) =>
    request<{ domain: Domain; mapping: FieldMappingSuggestion[] }>(`/ai/field-mapping/${domain}`, {
      method: "POST",
      body: JSON.stringify({ rawFields }),
    }),
  classify: (domain: Domain) => request<{ domain: Domain; results: unknown[] }>(`/ai/classify/${domain}`, { method: "POST" }),
  anomalies: (domain: Domain) => request<unknown[]>(`/ai/anomalies/${domain}`),
};
