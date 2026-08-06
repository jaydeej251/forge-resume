"use client";

import type { ResumeStep } from "@/types/steps";
import { RESUME_STEPS, STEP_LABELS } from "@/types/steps";

type StageRailProps = {
  currentStep: ResumeStep;
  stepIndex: number;
  complete?: boolean;
  className?: string;
};

export function StageRail({
  currentStep,
  stepIndex,
  complete = false,
  className = "",
}: StageRailProps) {
  return (
    <nav
      aria-label="Resume stages"
      className={`flex min-w-0 items-center gap-1.5 ${className}`}
    >
      {RESUME_STEPS.map((step, index) => {
        const active = !complete && step === currentStep;
        const done = complete || index < stepIndex;
        return (
          <div key={step} className="flex min-w-0 flex-1 items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <div
                className={[
                  "stage-segment h-1 overflow-hidden rounded-full",
                  done || active ? "bg-slate-200/80" : "bg-slate-200/50",
                ].join(" ")}
                aria-hidden
              >
                <div
                  className={[
                    "h-full rounded-full transition-all duration-500 ease-out",
                    complete || done
                      ? "w-full bg-[var(--accent)]"
                      : active
                        ? "w-[55%] bg-[var(--ink)]"
                        : "w-0 bg-transparent",
                  ].join(" ")}
                />
              </div>
              <p
                className={[
                  "mt-1 truncate text-[9px] font-semibold tracking-wide sm:text-[10px]",
                  active
                    ? "text-[var(--ink)]"
                    : done
                      ? "text-[var(--accent)]"
                      : "text-slate-400",
                ].join(" ")}
              >
                <span className="sr-only">
                  {active ? "Current: " : done ? "Done: " : "Upcoming: "}
                </span>
                {STEP_LABELS[step]}
              </p>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
