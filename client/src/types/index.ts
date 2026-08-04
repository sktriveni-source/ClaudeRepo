export type VendorType = "RAW_MATERIAL" | "MANUFACTURING" | "BOTH";

export interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  contactEmail: string;
  location: string;
  rating: number | null;
}

export type RfqStatus = "SENT" | "QUOTED" | "ACCEPTED" | "REJECTED";

export interface Rfq {
  id: string;
  vendorId: string;
  vendorName: string;
  status: RfqStatus;
  quotedPrice: number | null;
  leadTimeDays: number | null;
  sentAt: string;
  quotedAt: string | null;
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export type RawMaterialStage =
  | "PLACE_ORDER"
  | "SOURCING"
  | "RFQ"
  | "ORDER"
  | "GOODS_RECEIPT"
  | "INVOICE"
  | "DONE";

export type ManufacturingStage =
  | "PLACE_ORDER"
  | "MODE_SELECTION"
  | "RFQ"
  | "ORDER"
  | "ORDER_COMPLETE"
  | "INVENTORY"
  | "DISTRIBUTION"
  | "DELIVERY"
  | "GOODS_RECEIPT"
  | "INVOICE"
  | "BILLING"
  | "DONE";

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  rfqId: string;
  amount: number;
  placedAt: string;
  status: string;
}

export interface RawMaterialGoodsReceipt {
  receivedQty: number;
  condition: string;
  notes: string;
  receivedDate: string;
}

export interface SupplierInvoice {
  invoiceNumber: string;
  amount: number;
  status: "PENDING" | "PAID";
  receivedAt: string;
  paidAt: string | null;
}

export interface RawMaterialProcurement {
  stage: RawMaterialStage;
  materials: Material[];
  candidateVendorIds: string[];
  rfqs: Rfq[];
  purchaseOrder: PurchaseOrder | null;
  goodsReceipt: RawMaterialGoodsReceipt | null;
  invoice: SupplierInvoice | null;
}

export interface ManufacturingOrder {
  id: string;
  vendorId: string | null;
  vendorName: string;
  placedAt: string;
  status: string;
}

export interface InventoryRecord {
  producedQty: number;
  warehouseLocation: string;
  stockedAt: string;
}

export interface DistributionRecord {
  carrier: string;
  shipmentId: string;
  dispatchedAt: string;
}

export interface DeliveryRecord {
  deliveryAddress: string;
  recipient: string;
  deliveredAt: string;
}

export interface CustomerGoodsReceipt {
  receivedQty: number;
  confirmedBy: string;
  confirmedAt: string;
}

export interface CustomerInvoice {
  invoiceNumber: string;
  amount: number;
  status: "ISSUED" | "PAID";
  issuedAt: string;
  paidAt: string | null;
}

export interface BillingRecord {
  paymentStatus: string;
  billedAt: string;
}

export interface Manufacturing {
  stage: ManufacturingStage | null;
  mode: "EXTERNAL" | "INHOUSE" | null;
  vendorId: string | null;
  vendorName: string | null;
  rfqs: Rfq[];
  order: ManufacturingOrder | null;
  orderCompletedAt: string | null;
  inventory: InventoryRecord | null;
  distribution: DistributionRecord | null;
  delivery: DeliveryRecord | null;
  goodsReceipt: CustomerGoodsReceipt | null;
  invoice: CustomerInvoice | null;
  billing: BillingRecord | null;
}

export type ApprovalCategory =
  | "RFQ"
  | "ORDER"
  | "GOODS_RECEIPT"
  | "INVOICE"
  | "INVENTORY"
  | "DISTRIBUTION"
  | "DELIVERY"
  | "BILLING";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Approval {
  id: string;
  category: ApprovalCategory;
  phase: string;
  stage: string;
  action: string;
  payload: Record<string, unknown>;
  summary: string;
  status: ApprovalStatus;
  requestedBy: string;
  requestedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  comments: string | null;
}

export interface ApprovalWithOrder extends Approval {
  orderId: string;
  customerName: string;
  productName: string;
}

export type TransactionType = "CREATED" | "ACTION" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CLOSED";

export interface Transaction {
  id: string;
  ts: string;
  phase: string;
  stage: string;
  category: string;
  type: TransactionType;
  actor: string;
  message: string;
  amount: number | null;
  refId: string | null;
}

export type OrderPhase = "RAW_MATERIALS" | "MANUFACTURING" | "CLOSED";

export interface RequirementOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  quantity: number;
  specifications: string;
  createdAt: string;
  phase: OrderPhase;
  closedAt: string | null;
  pendingApproval: Approval | null;
  approvals: Approval[];
  rawMaterial: RawMaterialProcurement;
  manufacturing: Manufacturing;
  transactions: Transaction[];
}
