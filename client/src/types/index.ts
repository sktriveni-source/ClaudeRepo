export type StageId = "DEVELOP" | "LAUNCH" | "GROWTH" | "MATURITY" | "DECLINE";

export interface Stage {
  id: StageId;
  label: string;
  order: number;
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  region?: string;
  since?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  material?: string;
  leadTimeDays?: number;
  country?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  cost: number;
  owner: string;
  lifecycleStage: StageId;
  createdAt: string;
  updatedAt: string;
  customers: Customer[];
  suppliers: Supplier[];
}

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface StageRequest {
  id: string;
  productId: string;
  productName: string;
  fromStage: StageId;
  toStage: StageId;
  status: RequestStatus;
  requestedBy: string;
  requestedAt: string;
  requestComment: string;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionComment: string | null;
}

export interface AuditEntry {
  id: string;
  productId: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}
