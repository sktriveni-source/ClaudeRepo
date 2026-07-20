export type Role = "admin" | "product_manager" | "engineer" | "compliance" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
}

export type LifecycleStage = "concept" | "design" | "active" | "phase_out" | "end_of_life" | "obsolete";

export type ComplianceStatus = "compliant" | "pending_review" | "non_compliant" | "not_applicable";

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  lifecycleStage: LifecycleStage;
  owner: string;
  revision: string;
  complianceStatus: ComplianceStatus;
  tags: string[];
  attributes: Record<string, string>;
  eolDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDocument {
  id: string;
  productId: string;
  name: string;
  type: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  content: string;
}

export type CRStatus = "draft" | "submitted" | "in_review" | "approved" | "rejected" | "implemented";
export type CRPriority = "low" | "medium" | "high" | "critical";

export interface ChangeRequest {
  id: string;
  productId: string;
  title: string;
  description: string;
  status: CRStatus;
  priority: CRPriority;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface AuditEntry {
  id: string;
  entityType: "product" | "document" | "changeRequest";
  entityId: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalDocuments: number;
  byStage: Record<string, number>;
  byCompliance: Record<string, number>;
  approachingEolCount: number;
  eolWithUnresolvedCRCount: number;
  openChangeRequestCount: number;
  crByStatus: Record<string, number>;
  dataQualityIssueCount: number;
  duplicateCandidateCount: number;
}

export interface EolWatchlistProduct extends Product {
  unresolvedChangeRequests: ChangeRequest[];
}

export interface AiQueryResult {
  answer: string;
  products: Product[];
  documents: ProductDocument[];
  changeRequests: ChangeRequest[];
  duplicates?: DuplicatePair[];
  qualityIssues?: DataQualityIssue[];
}

export interface DuplicatePair {
  productA: { id: string; code: string; name: string };
  productB: { id: string; code: string; name: string };
  similarity: number;
  reason: string;
}

export interface DataQualityIssue {
  severity: "high" | "medium" | "low";
  productId: string;
  productName: string;
  issue: string;
  recommendation: string;
}

export interface DocumentSummary {
  summary: string;
  keyMetadata: Record<string, string>;
  sentenceCount: number;
}
