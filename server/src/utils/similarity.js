// Small dependency-free string-similarity toolkit used by duplicate
// detection, field-mapping recommendations and the NL query parser.

export function normalize(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .toLowerCase()
    .replace(/[.,'"]/g, "")
    .replace(/\b(inc|incorporated|llc|ltd|limited|corp|corporation|co|company)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function levenshtein(a, b) {
  a = a || "";
  b = b || "";
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

// 0..1, 1 = identical
export function levenshteinSimilarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na && !nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}

export function tokenSet(str) {
  return new Set(normalize(str).split(/\s+/).filter(Boolean));
}

// Jaccard similarity over tokens, good for reordered words ("Global Steel Supply LLC" vs "Steel Supply Global")
export function jaccardSimilarity(a, b) {
  const ta = tokenSet(a);
  const tb = tokenSet(b);
  if (ta.size === 0 && tb.size === 0) return 1;
  const intersection = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 1 : intersection / union;
}

export function nameSimilarity(a, b) {
  // Blend edit-distance and token-overlap so both "typo" and "reordered/added-word"
  // duplicates score highly.
  return 0.5 * levenshteinSimilarity(a, b) + 0.5 * jaccardSimilarity(a, b);
}

export function normalizeTaxId(taxId) {
  if (!taxId) return "";
  return String(taxId).replace(/[^0-9]/g, "");
}

export function normalizeEmail(email) {
  if (!email) return "";
  return String(email).trim().toLowerCase();
}

export function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/[^0-9]/g, "");
}

export function normalizeAddress(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/\broad\b/g, "rd")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bstreet\b/g, "st")
    .replace(/\bparkway\b/g, "pkwy")
    .replace(/\bplaza\b/g, "plz")
    .replace(/\bcourt\b/g, "ct")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
