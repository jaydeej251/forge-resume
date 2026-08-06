"use client";

import Link from "next/link";
import { DownloadPdfButton } from "@/components/pdf/DownloadPdfButton";
import { StageRail } from "@/components/layout/StageRail";
import { useAuth } from "@/context/AuthContext";
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
  onRetrySave?: () => void;
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
  error: _error,
  currentStep,
  stepIndex,
  complete,
  onReset,
  onRetrySave,
}: AppTopBarProps) {
  const { user } = useAuth();
  const writing = llmStatus === "processing";

  return (
    <header className="app-topbar shrink-0 border-b border-[var(--line)]/80 bg-[var(--panel-elevated)]/90 backdrop-blur-md">
      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
        <div className="min-w-0 shrink-0">
          <Link
            href={user ? "/dashboard" : "/"}
            className="font-display text-lg font-semibold tracking-tight text-[var(--ink)] sm:text-xl"
          >
            Forge Resume
          </Link>
        </div>

        <div className="mx-auto hidden min-w-0 max-w-md flex-1 md:block">
          <StageRail
            currentStep={currentStep}
            stepIndex={stepIndex}
            complete={complete}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {status === "ready" && saveStatus === "error" && onRetrySave ? (
            <button
              type="button"
              onClick={onRetrySave}
              disabled={writing}
              className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-[var(--danger)] underline-offset-2 hover:underline disabled:opacity-50"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
              Save failed · Retry
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
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
              {status === "error" && "Can't load"}
              {status === "ready" &&
                (writing
                  ? "AI writing"
                  : complete
                    ? "Complete"
                    : saveLabel(saveStatus))}
            </span>
          )}

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

          {user ? (
            <Link
              href="/dashboard"
              className="hidden cursor-pointer rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)] transition hover:bg-slate-50 sm:inline-flex"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/signup?next=/builder"
              className="hidden cursor-pointer rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-slate-50 sm:inline-flex"
            >
              Save
            </Link>
          )}

          <button
            type="button"
            onClick={onReset}
            disabled={status === "loading" || writing}
            className="cursor-pointer rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)] transition hover:bg-slate-50 disabled:opacity-50"
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
    </header>
  );
}
