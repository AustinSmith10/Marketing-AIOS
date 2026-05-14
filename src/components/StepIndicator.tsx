"use client";

type Step = 1 | 2 | 3;

interface StepIndicatorProps {
  current: Step;
}

const steps = [
  { n: 1, label: "Brief" },
  { n: 2, label: "Content Plan" },
  { n: 3, label: "Write & Edit" },
] as const;

const StepIndicator: React.FC<StepIndicatorProps> = ({ current }) => {
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((step, i) => {
        const done = step.n < current;
        const active = step.n === current;

        return (
          <div key={step.n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? "bg-[#0b1f5c] text-white"
                    : active
                      ? "border-2 border-[#0b1f5c] text-[#0b1f5c]"
                      : "border-2 border-gray-200 text-gray-300"
                }`}
              >
                {done ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.n
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  active ? "text-[#0b1f5c]" : done ? "text-gray-500" : "text-gray-300"
                }`}
              >
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className={`mx-3 h-px w-12 ${step.n < current ? "bg-[#0b1f5c]" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
