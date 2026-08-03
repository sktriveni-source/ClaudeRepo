import type { Stage, StageId } from "../types";

interface Props {
  stages: Stage[];
  current: StageId;
  pendingTarget?: StageId | null;
}

export default function LifecycleTracker({ stages, current, pendingTarget }: Props) {
  const currentOrder = stages.find((s) => s.id === current)?.order ?? 0;

  return (
    <ol className="lifecycle-tracker">
      {stages.map((stage) => {
        const isDone = stage.order < currentOrder;
        const isCurrent = stage.id === current;
        const isPending = pendingTarget === stage.id;
        const classes = ["tracker-step"];
        if (isDone) classes.push("done");
        if (isCurrent) classes.push("current");
        if (isPending) classes.push("pending-target");
        return (
          <li key={stage.id} className={classes.join(" ")}>
            <span className="tracker-dot" />
            <span className="tracker-label">{stage.label}</span>
            {isPending && <span className="tracker-pending-tag">Pending approval</span>}
          </li>
        );
      })}
    </ol>
  );
}
