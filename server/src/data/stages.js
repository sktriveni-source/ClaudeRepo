// The single source of truth for the product lifecycle pipeline.
// Order matters: it defines what "next stage" and "skipped stage" mean
// for the approval workflow.
export const STAGES = [
  { id: "DEVELOP", label: "Develop", order: 0 },
  { id: "LAUNCH", label: "Launch / Introduction", order: 1 },
  { id: "GROWTH", label: "Growth", order: 2 },
  { id: "MATURITY", label: "Maturity", order: 3 },
  { id: "DECLINE", label: "Decline", order: 4 },
];

export const STAGE_IDS = STAGES.map((s) => s.id);

export function isValidStage(stageId) {
  return STAGE_IDS.includes(stageId);
}

export function stageOrder(stageId) {
  const stage = STAGES.find((s) => s.id === stageId);
  return stage ? stage.order : -1;
}

export function nextStageOf(stageId) {
  const order = stageOrder(stageId);
  const next = STAGES.find((s) => s.order === order + 1);
  return next ? next.id : null;
}
