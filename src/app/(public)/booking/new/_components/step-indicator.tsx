'use client';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Mobile: simple text indicator */}
      <div className="sm:hidden text-center mb-4">
        <span className="text-sm font-medium text-gray-500">
          Step {currentStep} of {steps.length}
        </span>
        <p className="text-base font-semibold text-gray-900">{steps[currentStep - 1]}</p>
      </div>

      {/* Desktop: full step bar */}
      <div className="hidden sm:flex items-start">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center relative">
              {/* Left connector — colored if the preceding step is complete */}
              {idx > 0 && (
                <div
                  className={`absolute top-4 right-1/2 left-0 h-0.5 -translate-y-px ${
                    idx < currentStep ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
              {/* Right connector — colored if this step is complete */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 right-0 h-0.5 -translate-y-px ${
                    isCompleted ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
              {/* Circle */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                  isCurrent
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : isCompleted
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              {/* Label */}
              <span
                className={`mt-1.5 text-xs font-medium text-center ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
