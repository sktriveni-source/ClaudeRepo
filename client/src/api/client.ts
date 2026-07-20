import type {
  AiQueryResult,
  AuditEntry,
  ChangeRequest,
  DashboardStats,
  DataQualityIssue,
  DocumentSummary,
  DuplicatePair,
  EolWatchlistProduct,
  Product,
  ProductDocument,
  User,
} from "../types";

const TOKEN_KEY = "aiplm_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  login: (email: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  me: () => request<User>("/auth/me"),
  listUsers: () => request<User[]>("/auth/users"),

  listProducts: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request<Product[]>(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id: string) => request<Product>(`/products/${id}`),
  createProduct: (data: Partial<Product>) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<void>(`/products/${id}`, { method: "DELETE" }),
  productDocuments: (id: string) => request<ProductDocument[]>(`/products/${id}/documents`),
  productChangeRequests: (id: string) => request<ChangeRequest[]>(`/products/${id}/change-requests`),
  productAudit: (id: string) => request<AuditEntry[]>(`/products/${id}/audit`),

  createDocument: (data: Partial<ProductDocument>) =>
    request<ProductDocument>("/documents", { method: "POST", body: JSON.stringify(data) }),
  deleteDocument: (id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }),
  summarizeDocument: (id: string) =>
    request<DocumentSummary>(`/documents/${id}/summarize`, { method: "POST" }),
  extractMetadata: (id: string) =>
    request<{ metadata: Record<string, string> }>(`/documents/${id}/extract-metadata`, { method: "POST" }),

  listChangeRequests: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request<ChangeRequest[]>(`/change-requests${qs ? `?${qs}` : ""}`);
  },
  createChangeRequest: (data: Partial<ChangeRequest>) =>
    request<ChangeRequest>("/change-requests", { method: "POST", body: JSON.stringify(data) }),
  updateChangeRequest: (id: string, data: Partial<ChangeRequest>) =>
    request<ChangeRequest>(`/change-requests/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  audit: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request<AuditEntry[]>(`/audit${qs ? `?${qs}` : ""}`);
  },

  dashboardStats: () => request<DashboardStats>("/dashboard/stats"),
  eolWatchlist: () => request<EolWatchlistProduct[]>("/dashboard/eol-watchlist"),

  aiQuery: (question: string) =>
    request<AiQueryResult>("/ai/query", { method: "POST", body: JSON.stringify({ question }) }),
  aiDuplicates: () => request<DuplicatePair[]>("/ai/duplicates"),
  aiDataQuality: () => request<DataQualityIssue[]>("/ai/data-quality"),
};

export { ApiError };
