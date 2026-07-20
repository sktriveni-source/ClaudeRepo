import type { CRStatus, ComplianceStatus, LifecycleStage } from "../types";

const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  concept: "Concept",
  design: "Design",
  active: "Active",
  phase_out: "Phase-Out",
  end_of_life: "End-of-Life",
  obsolete: "Obsolete",
};

const LIFECYCLE_COLORS: Record<LifecycleStage, string> = {
  concept: "neutral",
  design: "blue",
  active: "green",
  phase_out: "amber",
  end_of_life: "red",
  obsolete: "neutral",
};

export function LifecycleBadge({ stage }: { stage: LifecycleStage }) {
  return <span className={`badge ${LIFECYCLE_COLORS[stage]}`}>{LIFECYCLE_LABELS[stage]}</span>;
}

const COMPLIANCE_LABELS: Record<ComplianceStatus, string> = {
  compliant: "Compliant",
  pending_review: "Pending Review",
  non_compliant: "Non-Compliant",
  not_applicable: "N/A",
};

const COMPLIANCE_COLORS: Record<ComplianceStatus, string> = {
  compliant: "green",
  pending_review: "amber",
  non_compliant: "red",
  not_applicable: "neutral",
};

export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  return <span className={`badge ${COMPLIANCE_COLORS[status]}`}>{COMPLIANCE_LABELS[status]}</span>;
}

const CR_LABELS: Record<CRStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  implemented: "Implemented",
};

const CR_COLORS: Record<CRStatus, string> = {
  draft: "neutral",
  submitted: "blue",
  in_review: "amber",
  approved: "green",
  rejected: "red",
  implemented: "green",
};

export function CRStatusBadge({ status }: { status: CRStatus }) {
  return <span className={`badge ${CR_COLORS[status]}`}>{CR_LABELS[status]}</span>;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "neutral",
  medium: "blue",
  high: "amber",
  critical: "red",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`badge ${PRIORITY_COLORS[priority] || "neutral"}`}>{priority}</span>;
}

export { LIFECYCLE_LABELS, CR_LABELS, COMPLIANCE_LABELS };
