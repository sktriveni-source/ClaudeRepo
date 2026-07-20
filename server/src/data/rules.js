// Seed validation rules. `ruleType` drives the interpreter in
// services/validation.js. Rules can be authored by hand or generated from a
// natural-language prompt via services/nlRuleBuilder.js.
let nextId = 1;
const id = () => `rule-${String(nextId++).padStart(3, "0")}`;

export const rules = [
  { id: id(), domain: "suppliers", field: "taxId", ruleType: "required", severity: "high", description: "Supplier must have a tax ID on file", source: "seed" },
  { id: id(), domain: "suppliers", field: "taxId", ruleType: "regex", pattern: "^\\d{2}-\\d{7}$", severity: "medium", description: "Tax ID should match EIN format NN-NNNNNNN", source: "seed" },
  { id: id(), domain: "suppliers", field: "email", ruleType: "regex", pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", severity: "medium", description: "Email must be a valid address format", source: "seed" },
  { id: id(), domain: "suppliers", field: "addressLine1", ruleType: "required", severity: "high", description: "Supplier must have a street address", source: "seed" },
  { id: id(), domain: "suppliers", field: "city", ruleType: "required", severity: "medium", description: "Supplier must have a city", source: "seed" },
  { id: id(), domain: "suppliers", field: "state", ruleType: "required", severity: "medium", description: "Supplier must have a state/province", source: "seed" },
  { id: id(), domain: "suppliers", field: "postalCode", ruleType: "required", severity: "low", description: "Supplier should have a postal code", source: "seed" },
  { id: id(), domain: "suppliers", field: "paymentTermsDays", ruleType: "range", min: 0, max: 120, severity: "low", description: "Payment terms should be between 0 and 120 days", source: "seed" },

  { id: id(), domain: "customers", field: "email", ruleType: "regex", pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", severity: "medium", description: "Email must be a valid address format", source: "seed" },
  { id: id(), domain: "customers", field: "addressLine1", ruleType: "required", severity: "low", description: "Customer should have a street address on file", source: "seed" },
  { id: id(), domain: "customers", field: "phone", ruleType: "required", severity: "low", description: "Customer should have a phone number on file", source: "seed" },

  { id: id(), domain: "products", field: "unitPrice", ruleType: "range", min: 0.01, max: 500, severity: "medium", description: "Unit price should fall within the expected catalog range", source: "seed" },
  { id: id(), domain: "products", field: "description", ruleType: "required", severity: "low", description: "Product should have a description", source: "seed" },
  { id: id(), domain: "products", field: "category", ruleType: "enum", values: ["Fasteners", "Packaging", "Electronics", "Chemicals", "Office Supplies", "Textiles", "Coatings", "Renewable Energy", "Logistics"], severity: "low", description: "Category should match the standardized taxonomy (case-sensitive)", source: "seed" },
];

export function nextRuleId() {
  return id();
}
