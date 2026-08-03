let counters = {};

/** Generates a short, human-friendly, prefixed sequential id e.g. LEAD-1004. */
export function nextId(prefix) {
  const next = (counters[prefix] || 1000) + 1;
  counters[prefix] = next;
  return `${prefix}-${next}`;
}

export function resetIdCounters() {
  counters = {};
}
