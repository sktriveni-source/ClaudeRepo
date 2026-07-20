import { getRecords, getRules, addIssue, clearIssuesFromRun } from "../store/db.js";

function isEmpty(v) {
  return v === null || v === undefined || v === "";
}

function evaluateRule(rule, value) {
  switch (rule.ruleType) {
    case "required":
      return isEmpty(value) ? `Missing required value for "${rule.field}"` : null;
    case "regex": {
      if (isEmpty(value)) return null; // handled by a separate `required` rule if needed
      const re = new RegExp(rule.pattern);
      return re.test(String(value)) ? null : `"${rule.field}" value "${value}" does not match expected format`;
    }
    case "range": {
      if (isEmpty(value)) return null;
      const num = Number(value);
      if (Number.isNaN(num)) return `"${rule.field}" value "${value}" is not numeric`;
      if (num < rule.min || num > rule.max) return `"${rule.field}" value ${num} is outside expected range [${rule.min}, ${rule.max}]`;
      return null;
    }
    case "enum": {
      if (isEmpty(value)) return null;
      return rule.values.includes(value) ? null : `"${rule.field}" value "${value}" is not one of the standardized values`;
    }
    default:
      return null;
  }
}

export function runValidation(domain) {
  const records = getRecords(domain);
  const domainRules = getRules(domain);

  clearIssuesFromRun(domain, "validity");
  clearIssuesFromRun(domain, "completeness");

  const created = [];
  for (const record of records) {
    for (const rule of domainRules) {
      const message = evaluateRule(rule, record[rule.field]);
      if (message) {
        const category = rule.ruleType === "required" ? "completeness" : "validity";
        created.push(
          addIssue({
            domain,
            recordId: record.id,
            sourceId: record.sourceId,
            category,
            field: rule.field,
            ruleId: rule.id,
            severity: rule.severity,
            description: `${record.name || record.sku || record.id}: ${message}`,
          })
        );
      }
    }
  }
  return created;
}

export function runAllValidations() {
  return {
    suppliers: runValidation("suppliers"),
    customers: runValidation("customers"),
    products: runValidation("products"),
  };
}
