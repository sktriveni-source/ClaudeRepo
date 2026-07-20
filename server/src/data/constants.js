export const ROLES = {
  ADMIN: "admin",
  PRODUCT_MANAGER: "product_manager",
  ENGINEER: "engineer",
  COMPLIANCE: "compliance",
  VIEWER: "viewer",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Administrator",
  [ROLES.PRODUCT_MANAGER]: "Product Manager",
  [ROLES.ENGINEER]: "Engineer",
  [ROLES.COMPLIANCE]: "Compliance Officer",
  [ROLES.VIEWER]: "Viewer",
};

export const LIFECYCLE_STAGES = [
  "concept",
  "design",
  "active",
  "phase_out",
  "end_of_life",
  "obsolete",
];

export const LIFECYCLE_LABELS = {
  concept: "Concept",
  design: "Design",
  active: "Active",
  phase_out: "Phase-Out",
  end_of_life: "End-of-Life",
  obsolete: "Obsolete",
};

export const COMPLIANCE_STATUSES = [
  "compliant",
  "pending_review",
  "non_compliant",
  "not_applicable",
];

export const COMPLIANCE_LABELS = {
  compliant: "Compliant",
  pending_review: "Pending Review",
  non_compliant: "Non-Compliant",
  not_applicable: "N/A",
};

export const DOCUMENT_TYPES = [
  "Specification",
  "Drawing",
  "Compliance Certificate",
  "User Manual",
  "Test Report",
];

export const CR_STATUSES = [
  "draft",
  "submitted",
  "in_review",
  "approved",
  "rejected",
  "implemented",
];

export const CR_STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  implemented: "Implemented",
};

export const UNRESOLVED_CR_STATUSES = ["draft", "submitted", "in_review"];

export const CR_PRIORITIES = ["low", "medium", "high", "critical"];

// Permission matrix: action -> roles allowed
export const PERMISSIONS = {
  "products:read": [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.ENGINEER, ROLES.COMPLIANCE, ROLES.VIEWER],
  "products:write": [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.ENGINEER],
  "products:delete": [ROLES.ADMIN],
  "documents:read": [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.ENGINEER, ROLES.COMPLIANCE, ROLES.VIEWER],
  "documents:write": [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.ENGINEER],
  "documents:delete": [ROLES.ADMIN, ROLES.PRODUCT_MANAGER],
  "changeRequests:read": [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.ENGINEER, ROLES.COMPLIANCE, ROLES.VIEWER],
  "changeRequests:write": [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.ENGINEER],
  "changeRequests:approve": [ROLES.ADMIN, ROLES.PRODUCT_MANAGER],
  "audit:read": [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.COMPLIANCE],
  "ai:query": [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.ENGINEER, ROLES.COMPLIANCE, ROLES.VIEWER],
  "ai:insights": [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.COMPLIANCE],
};
