"use client";

import { DownloadPdfButton } from "@/components/pdf/DownloadPdfButton";
import { StageRail } from "@/components/layout/StageRail";
import type { SaveStatus, SessionStatus } from "@/context/ResumeContext";
import type { LlmStatus } from "@/lib/api";
import type { ResumeState } from "@/types/resume";
import type { ResumeStep } from "@/types/steps";
import type { TemplateId } from "@/templates/registry";
import { templateSupportsPhoto } from "@/templates/registry";

type AppTopBarProps = {
  resume: ResumeState;
  template: TemplateId;
  photoUrl: string | null;
  status: SessionStatus;
  saveStatus: SaveStatus;
  llmStatus: LlmStatus;
  error: string | null;
  currentStep: ResumeStep;
  stepIndex: number;
  complete: boolean;
  onReset: () => void;
};

function saveLabel(status: SaveStatus) {
  switch (status) {
    case "saving":
      return "Saving";
    case "saved":
      return "Saved";
    case "error":
      return "Save failed";
    default:
      return "Synced";
  }
}

export function AppTopBar({
  resume,
  template,
  photoUrl,
  status,
  saveStatus,
  llmStatus,
  error,
  currentStep,
  stepIndex,
  complete,
  onReset,
}: AppTopBarProps) {
  const writing = llmStatus === "processing";

  return (
    <header className="app-topbar shrink-0 border-b border-[var(--line)]/80 bg-[var(--panel-elevated)]/90 backdrop-blur-md">
      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
        <div className="min-w-0 shrink-0">
          <p className="font-display text-lg font-semibold tracking-tight text-[var(--ink)] sm:text-xl">
            Forge Resume
          </p>
        </div>

        <div className="mx-auto hidden min-w-0 max-w-md flex-1 md:block">
          <StageRail
            currentStep={currentStep}
            stepIndex={stepIndex}
            complete={complete}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 text-[11px] text-[var(--muted)] sm:inline-flex">
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                status === "error"
                  ? "bg-[var(--danger)]"
                  : writing
                    ? "bg-amber-400 pulse-soft"
                    : status === "ready"
                      ? "bg-[var(--accent)]"
                      : "bg-amber-400 pulse-soft",
              ].join(" ")}
            />
            {status === "loading" && "Connecting"}
            {status === "error" && "Offline"}
            {status === "ready" &&
              (writing
                ? "AI writing"
                : complete
                  ? "Complete"
                  : saveLabel(saveStatus))}
          </span>

          {(complete || status === "ready") && (
            <DownloadPdfButton
              resume={resume}
              template={template}
              photoUrl={templateSupportsPhoto(template) ? photoUrl : null}
              variant={complete ? "accent" : "ghost"}
              size="sm"
              className="hidden sm:inline-flex"
            />
          )}

          <button
            type="button"
            onClick={onReset}
            disabled={status === "loading" || writing}
            className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)] transition hover:bg-slate-50 disabled:opacity-50"
          >
            New
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--line)]/60 px-3 py-2 md:hidden">
        <StageRail
          currentStep={currentStep}
          stepIndex={stepIndex}
          complete={complete}
        />
      </div>

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-1.5 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
    </header>
  );
}
