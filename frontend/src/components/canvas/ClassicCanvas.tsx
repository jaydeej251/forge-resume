"use client";

import { EditableText } from "@/components/canvas/EditableText";
import { PhotoSlot } from "@/components/canvas/PhotoSlot";
import {
  ContactLine,
  ResumeBodySections,
  useResumePatch,
} from "@/components/canvas/canvasShared";

export function ClassicCanvas() {
  const { resume, patch } = useResumePatch();
  const info = resume.personal_info;

  return (
    <article className="resume-sheet resume-classic mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col bg-[var(--paper)] px-10 py-9 text-slate-900">
      <header className="mb-5">
        <div className="flex flex-col items-center gap-3">
          <PhotoSlot variant="circle" />
          <div className="w-full text-center">
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
              className="block text-[28px] font-semibold tracking-tight text-slate-900"
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
              className="mt-1 block text-[13px] font-medium text-slate-600"
            />
            <ContactLine align="center" />
          </div>
        </div>
      </header>

      <ResumeBodySections density="classic" />
    </article>
  );
}
