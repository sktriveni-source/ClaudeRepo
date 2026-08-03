interface StageStepperProps {
  title: string;
  stages: { key: string; label: string }[];
  currentStage: string | null;
}

export function StageStepper({ title, stages, currentStage }: StageStepperProps) {
  const currentIndex = currentStage ? stages.findIndex((s) => s.key === currentStage) : -1;

  return (
    <div className="stepper">
      <h3 className="stepper__title">{title}</h3>
      <ol className="stepper__list">
        {stages.map((stage, index) => {
          let state: "done" | "current" | "pending" = "pending";
          if (currentIndex === -1) {
            state = "pending";
          } else if (index < currentIndex) {
            state = "done";
          } else if (index === currentIndex) {
            state = "current";
          }
          return (
            <li key={stage.key} className={`stepper__step stepper__step--${state}`}>
              <span className="stepper__marker">{state === "done" ? "✓" : index + 1}</span>
              <span className="stepper__label">{stage.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
