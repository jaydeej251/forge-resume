"use client";

import { EditableText } from "@/components/canvas/EditableText";
import { PhotoSlot } from "@/components/canvas/PhotoSlot";
import {
  ContactLine,
  ResumeBodySections,
  useResumePatch,
} from "@/components/canvas/canvasShared";

export function ExecutiveCanvas() {
  const { resume, patch } = useResumePatch();
  const info = resume.personal_info;

  return (
    <article className="resume-sheet mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col bg-[var(--paper)] px-12 py-11 text-slate-900">
      <header className="mb-7 flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-5">
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
            className="block font-serif text-[32px] font-semibold tracking-tight text-slate-900"
          />
          <EditableText
            value={info.target_role ?? ""}
            onChange={(target_role) =>
              patch((current) => ({
                ...current,
                personal_info: { ...current.personal_info, target_role },
              }))
            }
            placeholder="Target role (e.g. VP of Engineering)"
            className="mt-1 block text-[14px] font-medium uppercase tracking-[0.12em] text-slate-600"
          />
          <ContactLine align="left" className="!mt-3" />
        </div>
        <PhotoSlot variant="rounded" />
      </header>
      <ResumeBodySections
        density="executive"
        ruleClass="border-slate-900"
        accentClass="text-slate-700 hover:text-slate-900"
      />
    </article>
  );
}
