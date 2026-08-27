"use client";

import { STEPS, stepIndex, type StepKey } from "@/lib/steps";

export function Stepper({ current }: { current: StepKey }) {
  const currentIndex = stepIndex(current);

  return (
    <ol className="flex items-center gap-1 sm:gap-2" aria-label="Progress">
      {STEPS.map((step, i) => {
        const state =
          i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
        return (
          <li key={step.key} className="flex flex-1 items-center gap-1 sm:gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <span
                className={[
                  "h-1 rounded-full transition-colors",
                  state === "todo" ? "bg-slate-200" : "bg-emerald-500",
                ].join(" ")}
                aria-hidden
              />
              <span
                className={[
                  "truncate text-[11px] font-medium sm:text-xs",
                  state === "current"
                    ? "text-emerald-700"
                    : state === "done"
                      ? "text-slate-500"
                      : "text-slate-400",
                ].join(" ")}
                aria-current={state === "current" ? "step" : undefined}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
