"use client";

import { EditableText } from "@/components/canvas/EditableText";
import { PhotoSlot } from "@/components/canvas/PhotoSlot";
import {
  ContactLine,
  ResumeBodySections,
  newWorkExperience,
  useResumePatch,
} from "@/components/canvas/canvasShared";

export function TimelineCanvas() {
  const { resume, patch } = useResumePatch();
  const info = resume.personal_info;

  return (
    <article className="resume-sheet mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col bg-[var(--paper)] px-10 py-9 text-slate-900">
      <header className="mb-6 flex items-center gap-4">
        <PhotoSlot variant="circle" />
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
            className="block text-[26px] font-semibold tracking-tight"
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
            className="mt-0.5 block text-[13px] font-medium text-teal-700"
          />
          <ContactLine align="left" />
        </div>
      </header>

      <ResumeBodySections
        density="modern"
        hideExperience
        hideSkills
        hideEducation
        ruleClass="border-teal-800/30"
      />

      <section className="mb-4">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-800">
            Experience
          </h2>
          <button
            type="button"
            onClick={() =>
              patch((current) => ({
                ...current,
                work_experience: [
                  ...current.work_experience,
                  newWorkExperience(),
                ],
              }))
            }
            className="text-[10px] font-medium text-teal-700 hover:text-teal-900"
          >
            + Add role
          </button>
        </div>

        {resume.work_experience.length === 0 && (
          <p className="text-[11px] italic text-slate-400">
            No roles yet — describe them in chat, or add one here.
          </p>
        )}

        <div className="relative space-y-5 border-l-2 border-teal-700/40 pl-5">
          {resume.work_experience.map((job, jobIndex) => (
            <div key={job.id} className="group/job relative">
              <span className="absolute -left-[1.64rem] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-700 ring-4 ring-white" />
              <button
                type="button"
                onClick={() =>
                  patch((current) => ({
                    ...current,
                    work_experience: current.work_experience.filter(
                      (item) => item.id !== job.id,
                    ),
                  }))
                }
                className="absolute -right-1 -top-1 hidden rounded bg-white px-1.5 py-0.5 text-[10px] text-red-600 ring-1 ring-red-200 group-hover/job:block"
              >
                Remove
              </button>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <EditableText
                  value={job.position}
                  onChange={(position) =>
                    patch((current) => {
                      const work_experience = [...current.work_experience];
                      work_experience[jobIndex] = {
                        ...work_experience[jobIndex],
                        position,
                      };
                      return { ...current, work_experience };
                    })
                  }
                  placeholder="Job title"
                  className="text-[13px] font-semibold"
                />
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <EditableText
                    value={job.start_date}
                    onChange={(start_date) =>
                      patch((current) => {
                        const work_experience = [...current.work_experience];
                        work_experience[jobIndex] = {
                          ...work_experience[jobIndex],
                          start_date,
                        };
                        return { ...current, work_experience };
                      })
                    }
                    placeholder="Start"
                  />
                  <span>–</span>
                  <EditableText
                    value={job.current ? "Present" : job.end_date}
                    onChange={(end_date) =>
                      patch((current) => {
                        const work_experience = [...current.work_experience];
                        work_experience[jobIndex] = {
                          ...work_experience[jobIndex],
                          end_date: end_date === "Present" ? "" : end_date,
                          current: end_date.toLowerCase() === "present",
                        };
                        return { ...current, work_experience };
                      })
                    }
                    placeholder="End / Present"
                  />
                </div>
              </div>
              <EditableText
                value={job.company}
                onChange={(company) =>
                  patch((current) => {
                    const work_experience = [...current.work_experience];
                    work_experience[jobIndex] = {
                      ...work_experience[jobIndex],
                      company,
                    };
                    return { ...current, work_experience };
                  })
                }
                placeholder="Company"
                className="mt-0.5 block text-[12px] font-medium text-slate-700"
              />
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] text-slate-700">
                {job.bullet_points.map((bullet, bulletIndex) => (
                  <li key={`${job.id}-${bulletIndex}`}>
                    <EditableText
                      multiline
                      value={bullet}
                      onChange={(nextBullet) =>
                        patch((current) => {
                          const work_experience = [...current.work_experience];
                          const bullet_points = [
                            ...work_experience[jobIndex].bullet_points,
                          ];
                          bullet_points[bulletIndex] = nextBullet;
                          work_experience[jobIndex] = {
                            ...work_experience[jobIndex],
                            bullet_points,
                          };
                          return { ...current, work_experience };
                        })
                      }
                      placeholder="Impact-driven achievement…"
                      className="block w-full"
                    />
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() =>
                  patch((current) => {
                    const work_experience = [...current.work_experience];
                    work_experience[jobIndex] = {
                      ...work_experience[jobIndex],
                      bullet_points: [
                        ...work_experience[jobIndex].bullet_points,
                        "",
                      ],
                    };
                    return { ...current, work_experience };
                  })
                }
                className="mt-1 text-[10px] font-medium text-teal-700 hover:text-teal-900"
              >
                + Add bullet
              </button>
            </div>
          ))}
        </div>
      </section>

      <ResumeBodySections
        density="modern"
        hideSummary
        hideExperience
        ruleClass="border-teal-800/30"
      />
    </article>
  );
}
