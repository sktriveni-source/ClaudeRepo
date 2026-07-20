let counters = {};

export function nextId(prefix) {
  counters[prefix] = (counters[prefix] || 0) + 1;
  return `${prefix}-${String(counters[prefix]).padStart(4, "0")}`;
}

export function resetIds() {
  counters = {};
}
