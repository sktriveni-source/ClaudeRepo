import type { RequirementOrder, Vendor, VendorType } from "../types";

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

  // Raw material procurement
  placeRawMaterialOrder: (id: string) => post<RequirementOrder>(`/orders/${id}/raw-material/place`),
  sourceRawMaterialVendors: (id: string, vendorIds: string[]) =>
    post<RequirementOrder>(`/orders/${id}/raw-material/sourcing`, { vendorIds }),
  quoteRawMaterialRfq: (id: string, rfqId: string, quotedPrice: number, leadTimeDays: number) =>
    post<RequirementOrder>(`/orders/${id}/raw-material/rfq/${rfqId}/quote`, {
      quotedPrice,
      leadTimeDays,
    }),
  acceptRawMaterialRfq: (id: string, rfqId: string) =>
    post<RequirementOrder>(`/orders/${id}/raw-material/rfq/${rfqId}/accept`),
  recordRawMaterialGoodsReceipt: (
    id: string,
    data: { receivedQty: number; condition: string; notes?: string }
  ) => post<RequirementOrder>(`/orders/${id}/raw-material/goods-receipt`, data),
  recordRawMaterialInvoice: (id: string, data: { invoiceNumber: string; amount: number }) =>
    post<RequirementOrder>(`/orders/${id}/raw-material/invoice`, data),
  payRawMaterialInvoice: (id: string) =>
    post<RequirementOrder>(`/orders/${id}/raw-material/invoice/pay`),

  // Manufacturing, inventory & distribution
  placeManufacturingOrder: (id: string) => post<RequirementOrder>(`/orders/${id}/manufacturing/place`),
  selectManufacturingMode: (
    id: string,
    data: { mode: "EXTERNAL" | "INHOUSE"; vendorIds?: string[]; unitName?: string }
  ) => post<RequirementOrder>(`/orders/${id}/manufacturing/mode`, data),
  quoteManufacturingRfq: (id: string, rfqId: string, quotedPrice: number, leadTimeDays: number) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/rfq/${rfqId}/quote`, {
      quotedPrice,
      leadTimeDays,
    }),
  acceptManufacturingRfq: (id: string, rfqId: string) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/rfq/${rfqId}/accept`),
  completeManufacturingOrder: (id: string) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/order/complete`),
  recordInventory: (id: string, data: { producedQty: number; warehouseLocation: string }) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/inventory`, data),
  recordDistribution: (id: string, data: { carrier: string; shipmentId?: string }) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/distribution`, data),
  recordDelivery: (id: string, data: { deliveryAddress: string; recipient: string }) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/delivery`, data),
  recordCustomerGoodsReceipt: (id: string, data: { receivedQty: number; confirmedBy: string }) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/goods-receipt`, data),
  recordCustomerInvoice: (id: string, data: { invoiceNumber: string; amount: number }) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/invoice`, data),
  recordBilling: (id: string, data: { paymentStatus: string }) =>
    post<RequirementOrder>(`/orders/${id}/manufacturing/billing`, data),
  closeOrder: (id: string) => post<RequirementOrder>(`/orders/${id}/close`),
};
