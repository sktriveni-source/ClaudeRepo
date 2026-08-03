import type { StageId } from "../types";

const STAGE_LABELS: Record<StageId, string> = {
  DEVELOP: "Develop",
  LAUNCH: "Launch / Introduction",
  GROWTH: "Growth",
  MATURITY: "Maturity",
  DECLINE: "Decline",
};

export default function StageBadge({ stage }: { stage: StageId }) {
  return <span className={`stage-badge stage-${stage.toLowerCase()}`}>{STAGE_LABELS[stage]}</span>;
}
