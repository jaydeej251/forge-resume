"use client";

import { EditableText } from "@/components/canvas/EditableText";
import { PhotoSlot } from "@/components/canvas/PhotoSlot";
import {
  ContactLine,
  ResumeBodySections,
  useResumePatch,
} from "@/components/canvas/canvasShared";

export function CreativeCanvas() {
  const { resume, patch } = useResumePatch();
  const info = resume.personal_info;

  return (
    <article className="resume-sheet mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col overflow-hidden bg-[var(--paper)] text-slate-900">
      <header className="bg-[var(--accent)] px-10 py-7 text-white">
        <div className="flex items-center gap-4">
          <PhotoSlot variant="rounded" className="brightness-110" />
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
              className="block text-[28px] font-semibold tracking-tight text-white"
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
              className="mt-1 block text-[13px] font-medium text-teal-50"
            />
          </div>
        </div>
        <div className="mt-3 text-teal-50 [&_*]:text-teal-50">
          <ContactLine align="left" className="!mt-0 !text-[11px]" />
        </div>
      </header>
      <div className="flex-1 px-10 py-7">
        <ResumeBodySections
          density="modern"
          ruleClass="border-teal-700/40"
          accentClass="text-teal-700 hover:text-teal-900"
        />
      </div>
    </article>
  );
}
