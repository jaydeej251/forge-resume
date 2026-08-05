"use client";

import { EditableText } from "@/components/canvas/EditableText";
import { PhotoSlot } from "@/components/canvas/PhotoSlot";
import {
  ContactLine,
  ResumeBodySections,
  useResumePatch,
} from "@/components/canvas/canvasShared";

export function ModernCanvas() {
  const { resume, patch } = useResumePatch();
  const info = resume.personal_info;

  return (
    <article className="resume-sheet resume-modern relative mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col overflow-hidden bg-[var(--paper)] text-slate-900">
      <div className="absolute inset-y-0 left-0 w-2 bg-[var(--accent)]" aria-hidden />
      <div className="flex flex-1 flex-col px-10 py-9 pl-12">
        <header className="mb-6 flex items-start gap-4">
          <PhotoSlot variant="rounded" />
          <div className="min-w-0 flex-1">
            <EditableText
              as="h1"
              value={info.full_name}
              onChange={(full_name) =>
                patch((current) => ({
                  ...current,
                  personal_info: { ...current.personal_info, full_name },
                }))
              }
              placeholder="Your Full Name"
              className="block text-[26px] font-semibold tracking-tight text-slate-900"
            />
            <EditableText
              value={info.target_role ?? ""}
              onChange={(target_role) =>
                patch((current) => ({
                  ...current,
                  personal_info: { ...current.personal_info, target_role },
                }))
              }
              placeholder="Target role (e.g. Software Engineer)"
              className="mt-1 block text-[13px] font-semibold text-[var(--accent)]"
            />
            <ContactLine align="left" className="!mt-2" />
          </div>
        </header>

        <ResumeBodySections
          density="modern"
          ruleClass="border-teal-800/40"
          accentClass="text-teal-700 hover:text-teal-900"
        />
      </div>
    </article>
  );
}
