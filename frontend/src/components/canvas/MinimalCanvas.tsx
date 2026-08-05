"use client";

import { EditableText } from "@/components/canvas/EditableText";
import {
  ContactLine,
  ResumeBodySections,
  useResumePatch,
} from "@/components/canvas/canvasShared";

export function MinimalCanvas() {
  const { resume, patch } = useResumePatch();
  const info = resume.personal_info;

  return (
    <article className="resume-sheet mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col bg-[var(--paper)] px-10 py-8 font-sans text-slate-900">
      <header className="mb-5">
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
          className="block text-[22px] font-medium tracking-tight text-slate-900"
        />
        <EditableText
          value={info.target_role ?? ""}
          onChange={(target_role) =>
            patch((current) => ({
              ...current,
              personal_info: { ...current.personal_info, target_role },
            }))
          }
          placeholder="Target role"
          className="mt-0.5 block text-[12px] text-slate-500"
        />
        <ContactLine align="left" className="!mt-2 !text-[10px] !text-slate-500" />
        <div className="mt-4 h-px w-full bg-slate-300" />
      </header>
      <ResumeBodySections
        density="minimal"
        ruleClass="border-slate-300"
        accentClass="text-slate-600 hover:text-slate-900"
      />
    </article>
  );
}
