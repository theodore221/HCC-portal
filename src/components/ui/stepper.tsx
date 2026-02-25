export function Stepper({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;
        return (
          <li key={step} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                isActive
                  ? "bg-primary text-white"
                  : isComplete
                  ? "bg-primary/40 text-foreground"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {index + 1}
            </span>
            <span className={isActive ? "font-semibold text-foreground" : "text-gray-600"}>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
