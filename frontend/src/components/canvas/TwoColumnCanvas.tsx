"use client";

import { EditableText } from "@/components/canvas/EditableText";
import { PhotoSlot } from "@/components/canvas/PhotoSlot";
import {
  ContactLine,
  ResumeBodySections,
  useResumePatch,
} from "@/components/canvas/canvasShared";

export function TwoColumnCanvas() {
  const { resume, patch } = useResumePatch();
  const info = resume.personal_info;

  return (
    <article className="resume-sheet mx-auto flex min-h-[297mm] w-[210mm] max-w-full overflow-hidden bg-[var(--paper)] text-slate-900">
      <aside className="flex w-[34%] flex-col bg-slate-900 px-5 py-8 text-slate-100">
        <PhotoSlot variant="rounded" className="mb-4 self-start" />
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
          className="block text-[18px] font-semibold leading-snug text-white"
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
          className="mt-1 block text-[11px] font-medium text-teal-300"
        />
        <div className="mt-4 space-y-1 text-[10px] text-slate-300 [&_*]:text-slate-300">
          <ContactLine align="left" className="!mt-0 !flex-col !items-start !gap-1" />
        </div>

        <div className="mt-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-300">
            Skills
          </p>
          <div className="mt-2 space-y-3 text-[11px] text-slate-200">
            <div>
              <p className="font-semibold text-white">Technical</p>
              <EditableText
                value={resume.skills.technical.join(", ")}
                onChange={(value) =>
                  patch((current) => ({
                    ...current,
                    skills: {
                      ...current.skills,
                      technical: value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    },
                  }))
                }
                placeholder="React, TypeScript…"
                className="mt-1 block leading-relaxed"
              />
            </div>
            <div>
              <p className="font-semibold text-white">Soft</p>
              <EditableText
                value={resume.skills.soft.join(", ")}
                onChange={(value) =>
                  patch((current) => ({
                    ...current,
                    skills: {
                      ...current.skills,
                      soft: value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    },
                  }))
                }
                placeholder="Leadership…"
                className="mt-1 block leading-relaxed"
              />
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 px-7 py-8">
        <ResumeBodySections
          density="modern"
          hideSkills
          ruleClass="border-slate-300"
          accentClass="text-teal-700 hover:text-teal-900"
        />
      </div>
    </article>
  );
}
