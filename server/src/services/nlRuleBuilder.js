// "AI opportunity: natural-language rule creation" — turn a plain-English
// data-quality requirement into a structured validation rule a steward can
// review and save, e.g. "Suppliers must always have a valid tax ID" or
// "Product unit price should be between 0.01 and 500".
const DOMAIN_ALIASES = [
  { domain: "suppliers", pattern: /\bsuppliers?\b|\bvendors?\b/i },
  { domain: "customers", pattern: /\bcustomers?\b|\bclients?\b/i },
  { domain: "products", pattern: /\bproducts?\b|\bitems?\b/i },
];

const FIELD_ALIASES = {
  taxId: /tax id|tax number|ein/i,
  email: /email/i,
  phone: /phone/i,
  addressLine1: /(street )?address/i,
  city: /\bcity\b/i,
  state: /\bstate\b/i,
  postalCode: /postal code|zip ?code/i,
  category: /\bcategory\b/i,
  unitPrice: /unit price|price/i,
  paymentTermsDays: /payment terms/i,
  description: /description/i,
  lifetimeValue: /lifetime value/i,
};

const FORMAT_RULES = {
  email: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", description: "must be a valid email address format" },
  taxId: { pattern: "^\\d{2}-\\d{7}$", description: "must match EIN format NN-NNNNNNN" },
};

function detectSeverity(text) {
  if (/critical|must always|mandatory/i.test(text)) return "high";
  if (/should|prefer|recommend/i.test(text)) return "low";
  return "medium";
}

export function buildRuleFromText(text) {
  const domainMatch = DOMAIN_ALIASES.find((d) => d.pattern.test(text));
  const domain = domainMatch?.domain;
  if (!domain) {
    return { understood: false, message: 'Could not identify the entity type — start with "Suppliers...", "Customers...", or "Products...".' };
  }

  const fieldEntry = Object.entries(FIELD_ALIASES).find(([, re]) => re.test(text));
  const field = fieldEntry?.[0];
  if (!field) {
    return { understood: false, domain, message: "Could not identify which field this rule applies to." };
  }

  const severity = detectSeverity(text);

  const rangeMatch = text.match(/between\s+([\d.]+)\s+and\s+([\d.]+)/i);
  const maxMatch = text.match(/no more than\s+([\d.]+)|less than\s+([\d.]+)|at most\s+([\d.]+)|below\s+([\d.]+)/i);
  const minMatch = text.match(/at least\s+([\d.]+)|greater than\s+([\d.]+)|above\s+([\d.]+)|more than\s+([\d.]+)/i);

  if (rangeMatch) {
    return {
      understood: true,
      rule: { domain, field, ruleType: "range", min: Number(rangeMatch[1]), max: Number(rangeMatch[2]), severity, description: text.trim() },
    };
  }
  if (maxMatch || minMatch) {
    const max = maxMatch ? Number(maxMatch.slice(1).find(Boolean)) : Infinity;
    const min = minMatch ? Number(minMatch.slice(1).find(Boolean)) : 0;
    return {
      understood: true,
      rule: { domain, field, ruleType: "range", min, max, severity, description: text.trim() },
    };
  }

  if (/valid|correct format|properly formatted/i.test(text) && FORMAT_RULES[field]) {
    return {
      understood: true,
      rule: { domain, field, ruleType: "regex", pattern: FORMAT_RULES[field].pattern, severity, description: text.trim() },
    };
  }

  if (/must have|required|cannot be (blank|empty)|should always be present|mandatory|not be missing/i.test(text)) {
    return {
      understood: true,
      rule: { domain, field, ruleType: "required", severity, description: text.trim() },
    };
  }

  return { understood: false, domain, field, message: `Recognized "${domain}.${field}" but not the constraint type. Try phrasing like "must have a valid tax ID" or "price must be between 1 and 500".` };
}
