export type Domain = "suppliers" | "customers" | "products";

export interface DataSource {
  id: string;
  name: string;
  type: string;
  connector: string;
  endpoint: string;
  domain: Domain | "mixed";
  status: "connected" | "degraded" | "disconnected";
  lastSyncAt: string;
  syncFrequency: string;
  recordCount: number;
}

export interface MdmRecord {
  id: string;
  sourceId: string;
  sourceRecordId: string;
  name?: string;
  sku?: string;
  sourceName?: string;
  qualityScore?: number;
  [key: string]: unknown;
}

export interface FieldProfile {
  field: string;
  type: string;
  completeness: number;
  nullCount: number;
  distinctCount: number;
  uniqueness: number;
  formatConsistency: number;
  patternVariants: number;
  patterns: { pattern: string; count: number }[];
  sampleValues: string[];
}

export interface DomainProfile {
  domain: Domain;
  recordCount: number;
  sources: { id: string; name: string; recordCount: number }[];
  fields: FieldProfile[];
  summary: {
    avgCompleteness: number;
    avgFormatConsistency: number;
    weakestFields: string[];
    inconsistentFields: string[];
  };
}

export interface ValidationRule {
  id: string;
  domain: Domain;
  field: string;
  ruleType: "required" | "regex" | "range" | "enum";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  pattern?: string;
  min?: number;
  max?: number;
  values?: string[];
  source: string;
}

export interface Issue {
  id: string;
  domain: Domain;
  recordId: string;
  sourceId: string;
  category: "completeness" | "validity" | "anomaly" | "duplicate";
  field: string;
  ruleId?: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  status: "open" | "in_review" | "resolved" | "rejected";
  assignedTo?: string;
  createdAt: string;
}

export interface DuplicateClusterMember extends MdmRecord {
  sourceName: string;
  completeness: number;
}

export interface DuplicateCluster {
  id: string;
  domain: Domain;
  status: "open" | "pending_approval" | "merged" | "rejected";
  confidence: number;
  matchedFields: string[];
  suggestedGoldenRecordId: string;
  members: DuplicateClusterMember[];
  explanation: string;
}

export interface Approval {
  id: string;
  type: "merge_duplicate" | "reject_duplicate" | "apply_fix";
  domain: Domain;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  description: string;
  payload: Record<string, unknown>;
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
  comment?: string | null;
}

export interface DomainQualityScore {
  domain: Domain;
  overall: number;
  dimensions: { completeness: number; validity: number; uniqueness: number; consistency: number };
  sourceScores: { sourceId: string; sourceName: string; score: number }[];
  lowestRecords: { recordId: string; name: string; overall: number }[];
  recordCount: number;
}

export interface DashboardSummary {
  overallScore: number;
  trend: { label: string; score: number }[];
  domains: { domain: Domain; score: number; recordCount: number; dimensions: DomainQualityScore["dimensions"] }[];
  recordTotals: Record<Domain, number>;
  dataSources: { total: number; connected: number; degraded: number };
  issues: { open: number; total: number; bySeverity: Record<string, number>; byCategory: Record<string, number> };
  duplicates: { openClusters: number; totalClusters: number; recordsInvolved: number };
  approvals: { pending: number };
}

export interface NlQueryResult {
  query: string;
  understood: boolean;
  domain?: Domain;
  interpretedAs?: string;
  conditions?: string[];
  matchCount?: number;
  results?: (MdmRecord & { sourceName: string; matchReasons: string[] })[];
  message?: string;
}

export interface FieldMappingSuggestion {
  rawField: string;
  suggestedField: string | null;
  confidence: number;
  rationale: string;
}

export interface ClassificationResult {
  recordId: string;
  name: string;
  classification: Record<string, unknown>;
}
