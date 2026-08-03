import type { AuditEntry, Customer, Product, Stage, StageRequest, Supplier } from "../types";

const BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getStages: () => request<Stage[]>("/stages"),

  listProducts: () => request<Product[]>("/products"),
  getProduct: (id: string) => request<Product>(`/products/${id}`),
  createProduct: (data: Partial<Product>, actor: string) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify({ ...data, actor }) }),
  updateProduct: (id: string, data: Partial<Product>, actor: string) =>
    request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify({ ...data, actor }) }),
  deleteProduct: (id: string, actor: string) =>
    request<void>(`/products/${id}`, { method: "DELETE", body: JSON.stringify({ actor }) }),

  addCustomer: (productId: string, data: Partial<Customer>, actor: string) =>
    request<Customer>(`/products/${productId}/customers`, {
      method: "POST",
      body: JSON.stringify({ ...data, actor }),
    }),
  updateCustomer: (productId: string, customerId: string, data: Partial<Customer>, actor: string) =>
    request<Customer>(`/products/${productId}/customers/${customerId}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, actor }),
    }),
  deleteCustomer: (productId: string, customerId: string, actor: string) =>
    request<void>(`/products/${productId}/customers/${customerId}`, {
      method: "DELETE",
      body: JSON.stringify({ actor }),
    }),

  addSupplier: (productId: string, data: Partial<Supplier>, actor: string) =>
    request<Supplier>(`/products/${productId}/suppliers`, {
      method: "POST",
      body: JSON.stringify({ ...data, actor }),
    }),
  updateSupplier: (productId: string, supplierId: string, data: Partial<Supplier>, actor: string) =>
    request<Supplier>(`/products/${productId}/suppliers/${supplierId}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, actor }),
    }),
  deleteSupplier: (productId: string, supplierId: string, actor: string) =>
    request<void>(`/products/${productId}/suppliers/${supplierId}`, {
      method: "DELETE",
      body: JSON.stringify({ actor }),
    }),

  listStageRequests: (params?: { status?: string; productId?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.productId) query.set("productId", params.productId);
    const qs = query.toString();
    return request<StageRequest[]>(`/stage-requests${qs ? `?${qs}` : ""}`);
  },
  requestStageChange: (productId: string, toStage: string, actor: string, comment: string) =>
    request<StageRequest>("/stage-requests", {
      method: "POST",
      body: JSON.stringify({ productId, toStage, actor, comment }),
    }),
  approveStageRequest: (id: string, actor: string, comment: string) =>
    request<StageRequest>(`/stage-requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ actor, comment }),
    }),
  rejectStageRequest: (id: string, actor: string, comment: string) =>
    request<StageRequest>(`/stage-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ actor, comment }),
    }),

  getProductRequests: (productId: string) => request<StageRequest[]>(`/products/${productId}/requests`),
  getProductAudit: (productId: string) => request<AuditEntry[]>(`/products/${productId}/audit`),
};
