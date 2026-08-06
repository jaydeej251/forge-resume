"use client";

import { useEffect, useRef, useState } from "react";
import { ResumeCanvas } from "@/components/canvas/ResumeCanvas";
import { DownloadPdfButton } from "@/components/pdf/DownloadPdfButton";
import { TemplateSwitcher } from "@/components/templates/TemplateSwitcher";
import { useResume } from "@/context/ResumeContext";
import { templateSupportsPhoto } from "@/templates/registry";

type PreviewStageProps = {
  complete: boolean;
  showMobileDownload?: boolean;
};

export function PreviewStage({
  complete,
  showMobileDownload = false,
}: PreviewStageProps) {
  const { resume, status, llmStatus, template, photoUrl } = useResume();
  const [pulse, setPulse] = useState(false);
  const prevLlm = useRef(llmStatus);
  const prevTemplate = useRef(template);

  useEffect(() => {
    if (prevLlm.current === "processing" && llmStatus === "idle") {
      setPulse(true);
      const timer = window.setTimeout(() => setPulse(false), 700);
      prevLlm.current = llmStatus;
      return () => window.clearTimeout(timer);
    }
    prevLlm.current = llmStatus;
  }, [llmStatus]);

  useEffect(() => {
    if (prevTemplate.current !== template) {
      setPulse(true);
      const timer = window.setTimeout(() => setPulse(false), 700);
      prevTemplate.current = template;
      return () => window.clearTimeout(timer);
    }
  }, [template]);

  return (
    <section className="preview-stage relative flex min-h-0 flex-1 flex-col">
      <div className="preview-toolbar relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)]">Live canvas</p>
          <p className="text-xs text-[var(--muted)]">
            {complete
              ? "Final review — AI-assisted draft, check the canvas before sharing."
              : "Switch templates anytime. Content stays; photo shows when the template allows."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="hidden lg:block">
              <TemplateSwitcher />
            </div>
            <DownloadPdfButton
              resume={resume}
              template={template}
              photoUrl={templateSupportsPhoto(template) ? photoUrl : null}
              variant={complete ? "accent" : "ghost"}
              size="sm"
              className="hidden lg:inline-flex"
            />
          </div>
          <p className="max-w-xs text-right text-[10px] leading-relaxed text-[var(--muted)]">
            AI-assisted draft — review before sharing.
          </p>
        </div>
      </div>

      <div className="relative z-0 min-h-0 flex-1 overflow-auto px-3 pb-8 pt-2 sm:px-8 sm:pb-12 sm:pt-4">
        {status === "loading" ? (
          <div className="sheet-skeleton mx-auto w-[min(210mm,100%)] animate-pulse">
            <div className="space-y-4 px-10 py-12">
              <div className="mx-auto h-8 w-48 rounded bg-slate-200/80" />
              <div className="mx-auto h-3 w-64 rounded bg-slate-200/70" />
              <div className="mt-8 h-3 w-full rounded bg-slate-200/60" />
              <div className="h-3 w-5/6 rounded bg-slate-200/60" />
              <div className="h-3 w-4/6 rounded bg-slate-200/60" />
            </div>
          </div>
        ) : (
          <div
            className={[
              "sheet-float mx-auto origin-top scale-[0.68] sm:scale-[0.82] lg:scale-[0.92] xl:scale-100",
              pulse ? "sheet-pulse" : "",
            ].join(" ")}
          >
            <ResumeCanvas />
          </div>
        )}
      </div>

      {showMobileDownload && (
        <div className="sticky-download shrink-0 space-y-2 border-t border-[var(--line)]/70 bg-[var(--panel-elevated)]/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <TemplateSwitcher />
          <DownloadPdfButton
            resume={resume}
            template={template}
            photoUrl={templateSupportsPhoto(template) ? photoUrl : null}
            variant={complete ? "accent" : "primary"}
            className="w-full justify-center"
          />
          <p className="text-center text-[10px] leading-relaxed text-[var(--muted)]">
            AI-assisted draft — review on the canvas before sharing.
          </p>
        </div>
      )}
    </section>
  );
}
