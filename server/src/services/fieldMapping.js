// "AI opportunity: field mapping recommendations" — when onboarding a new
// source, suggest how its raw column names map onto the canonical MDM
// schema using a synonym dictionary plus fuzzy string matching.
import { levenshteinSimilarity } from "../utils/similarity.js";

const CANONICAL_SCHEMA = {
  suppliers: ["name", "taxId", "email", "phone", "addressLine1", "city", "state", "postalCode", "country", "category", "paymentTermsDays"],
  customers: ["name", "email", "phone", "addressLine1", "city", "state", "postalCode", "country", "lifetimeValue", "segment"],
  products: ["sku", "name", "category", "unit", "unitPrice", "description"],
};

const SYNONYMS = {
  name: ["companyname", "custname", "customername", "suppliername", "vendorname", "fullname", "legalname", "productname", "itemname", "cust_nm", "acct_name"],
  taxId: ["taxid", "ein", "vatid", "vatnumber", "taxnumber", "federalid", "tin"],
  email: ["emailaddress", "email_addr", "contactemail", "e_mail"],
  phone: ["phonenumber", "telephone", "tel", "contactphone", "mobile", "phone_no"],
  addressLine1: ["address", "address1", "street", "streetaddress", "addr1", "addressline1"],
  city: ["town", "cityname"],
  state: ["province", "region", "st"],
  postalCode: ["zip", "zipcode", "postcode", "postal"],
  country: ["countrycode", "nation"],
  category: ["type", "productcategory", "supplierclass", "class", "segment_code"],
  paymentTermsDays: ["terms", "paymentterms", "netterms", "net_days"],
  lifetimeValue: ["ltv", "totalspend", "revenue", "clv"],
  segment: ["tier", "customersegment", "accounttype"],
  sku: ["itemcode", "productcode", "itemnumber", "sku_id", "partnumber"],
  unit: ["uom", "unitofmeasure", "packunit"],
  unitPrice: ["price", "unitcost", "listprice", "cost"],
  description: ["desc", "productdescription", "details", "notes"],
};

function normalizeFieldName(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function recommendFieldMapping(domain, rawFields) {
  const canonical = CANONICAL_SCHEMA[domain];
  if (!canonical) throw new Error(`Unknown domain: ${domain}`);

  return rawFields.map((raw) => {
    const rawNorm = normalizeFieldName(raw);
    let best = { field: null, confidence: 0, reason: "" };

    for (const field of canonical) {
      const candidates = [field, ...(SYNONYMS[field] ?? [])];
      for (const candidate of candidates) {
        const candNorm = normalizeFieldName(candidate);
        let score;
        let reason;
        if (rawNorm === candNorm) {
          score = 1;
          reason = "exact match";
        } else if (rawNorm.includes(candNorm) || candNorm.includes(rawNorm)) {
          score = 0.85;
          reason = `substring match against "${candidate}"`;
        } else {
          score = levenshteinSimilarity(rawNorm, candNorm);
          reason = `fuzzy match against "${candidate}" (${Math.round(score * 100)}% similar)`;
        }
        if (score > best.confidence) best = { field, confidence: score, reason };
      }
    }

    return {
      rawField: raw,
      suggestedField: best.confidence >= 0.55 ? best.field : null,
      confidence: +best.confidence.toFixed(2),
      rationale: best.confidence >= 0.55 ? best.reason : "No confident match — map manually",
    };
  });
}

export function canonicalSchema(domain) {
  return CANONICAL_SCHEMA[domain];
}
