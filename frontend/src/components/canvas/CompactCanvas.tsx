"use client";

import { EditableText } from "@/components/canvas/EditableText";
import {
  ContactLine,
  ResumeBodySections,
  useResumePatch,
} from "@/components/canvas/canvasShared";

export function CompactCanvas() {
  const { resume, patch } = useResumePatch();
  const info = resume.personal_info;

  return (
    <article className="resume-sheet resume-compact mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col bg-[var(--paper)] px-8 py-6 font-sans text-slate-900">
      <header className="mb-3 border-b border-slate-400 pb-2">
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
          className="block text-[20px] font-bold tracking-tight text-slate-900"
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
          className="mt-0.5 block text-[11px] font-medium text-slate-600"
        />
        <ContactLine align="left" className="!mt-1 !text-[10px]" />
      </header>

      <ResumeBodySections
        density="compact"
        ruleClass="border-slate-500"
        accentClass="text-slate-600 hover:text-slate-900"
      />
    </article>
  );
}
