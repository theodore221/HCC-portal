export function Stepper({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-4 rounded-2xl border border-olive-100 bg-white p-4">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;
        return (
          <li key={step} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                isActive
                  ? "bg-olive-600 text-white"
                  : isComplete
                  ? "bg-olive-300 text-olive-900"
                  : "bg-olive-100 text-olive-700"
              }`}
            >
              {index + 1}
            </span>
            <span className={isActive ? "font-semibold text-olive-900" : "text-olive-700"}>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
