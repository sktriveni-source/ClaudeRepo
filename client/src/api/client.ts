import type { ApprovalWithOrder, RequirementOrder, Vendor, VendorType } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((body && body.error) || `Request failed with status ${res.status}`);
  }
  return body as T;
}

const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined });

export const api = {
  listVendors: (type?: VendorType) =>
    request<Vendor[]>(`/vendors${type ? `?type=${type}` : ""}`),
  createVendor: (data: { name: string; type: VendorType; contactEmail?: string; location?: string }) =>
    post<Vendor>("/vendors", data),

  listOrders: () => request<RequirementOrder[]>("/orders"),
  getOrder: (id: string) => request<RequirementOrder>(`/orders/${id}`),
  createOrder: (data: {
    customerName: string;
    customerEmail: string;
    productName: string;
    quantity: number;
    specifications?: string;
    materials: { name: string; quantity: number; unit: string }[];
  }) => post<RequirementOrder>("/orders", data),

  // Approvals
  listApprovals: (status?: string) =>
    request<ApprovalWithOrder[]>(`/approvals${status ? `?status=${status}` : ""}`),
  decideApproval: (
    orderId: string,
    approvalId: string,
    data: { decision: "APPROVED" | "REJECTED"; decidedBy: string; comments?: string }
  ) => post<RequirementOrder>(`/orders/${orderId}/approvals/${approvalId}/decide`, data),

  // Raw material procurement
  placeRawMaterialOrder: (id: string, actor: string) =>
    post<RequirementOrder>(`/orders/${id}/raw-material/place`, { actor }),
  sourceRawMaterialVendors: (id: string, vendorIds: string[], actor: string) =>
    post<RequirementOrder>(`/orders/${id}/raw-material/sourcing`, { vendorIds, actor }),
  quoteRawMaterialRfq: (id: string, rfqId: string, quotedPrice: number, leadTimeDays: number) =>
    post<RequirementOrder>(`/orders/${id}/raw-material/rfq/${rfqId}/quote`, {
      quotedPrice,
      leadTimeDays,
    }),
  submitAcceptRawMaterialRfq: (id: string, rfqId: string, requestedBy: string) =>
    post<RequirementOrder>(`/orders/${id}/raw-material/rfq/${rfqId}/accept`, { requestedBy }),
  submitPlaceRawMaterialOrder: (id: string, requestedBy: string) =>
    post<RequirementOrder>(`/orders/${id}/raw-material/order/place`, { requestedBy }),
  submitRawMaterialGoodsReceipt: (
    id: string,
    data: { receivedQty: number; condition: string; notes?: string; requestedBy: string }
  ) => post<RequirementOrder>(`/orders/${id}/raw-material/goods-receipt`, data),
  submitRawMaterialInvoice: (
    id: string,
    data: { invoiceNumber: string; amount: number; requestedBy: string }
  ) => post<RequirementOrder>(`/orders/${id}/raw-material/invoice`, data),
  payRawMaterialInvoice: (id: string, actor: string) =>
    post<RequirementOrder>(`/orders/${id}/raw-material/invoice/pay`, { actor }),

  // Manufacturing, inventory & distribution
  placeManufacturingOrder: (id: string, actor: string) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/place`, { actor }),
  selectManufacturingMode: (
    id: string,
    data: { mode: "EXTERNAL" | "INHOUSE"; vendorIds?: string[]; unitName?: string; requestedBy: string }
  ) => post<RequirementOrder>(`/orders/${id}/manufacturing/mode`, { ...data, actor: data.requestedBy }),
  quoteManufacturingRfq: (id: string, rfqId: string, quotedPrice: number, leadTimeDays: number) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/rfq/${rfqId}/quote`, {
      quotedPrice,
      leadTimeDays,
    }),
  submitAcceptManufacturingRfq: (id: string, rfqId: string, requestedBy: string) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/rfq/${rfqId}/accept`, { requestedBy }),
  submitPlaceManufacturingOrder: (id: string, requestedBy: string) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/order/place`, { requestedBy }),
  completeManufacturingOrder: (id: string, actor: string) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/order/complete`, { actor }),
  submitInventory: (
    id: string,
    data: { producedQty: number; warehouseLocation: string; requestedBy: string }
  ) => post<RequirementOrder>(`/orders/${id}/manufacturing/inventory`, data),
  submitDistribution: (id: string, data: { carrier: string; shipmentId?: string; requestedBy: string }) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/distribution`, data),
  submitDelivery: (
    id: string,
    data: { deliveryAddress: string; recipient: string; requestedBy: string }
  ) => post<RequirementOrder>(`/orders/${id}/manufacturing/delivery`, data),
  submitManufacturingGoodsReceipt: (
    id: string,
    data: { receivedQty: number; confirmedBy: string; requestedBy: string }
  ) => post<RequirementOrder>(`/orders/${id}/manufacturing/goods-receipt`, data),
  submitManufacturingInvoice: (
    id: string,
    data: { invoiceNumber: string; amount: number; requestedBy: string }
  ) => post<RequirementOrder>(`/orders/${id}/manufacturing/invoice`, data),
  submitBilling: (id: string, data: { paymentStatus: string; requestedBy: string }) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/billing`, data),
  closeOrder: (id: string, actor: string) => post<RequirementOrder>(`/orders/${id}/close`, { actor }),
};
