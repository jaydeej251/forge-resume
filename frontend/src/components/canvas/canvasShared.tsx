"use client";

import { EditableText } from "@/components/canvas/EditableText";
import { useResume } from "@/context/ResumeContext";
import type {
  Education,
  ResumeState,
  WorkExperience,
} from "@/types/resume";

export function newWorkExperience(): WorkExperience {
  return {
    id: crypto.randomUUID(),
    company: "",
    position: "",
    start_date: "",
    end_date: "",
    current: false,
    bullet_points: [""],
  };
}

export function newEducation(): Education {
  return {
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
    graduation_year: "",
  };
}

export function useResumePatch() {
  const { resume, setResume } = useResume();
  const patch = (updater: (current: ResumeState) => ResumeState) => {
    setResume(updater);
  };
  return { resume, patch };
}

type Density = "classic" | "modern" | "compact" | "executive" | "minimal";

const densityText: Record<
  Density,
  { section: string; body: string; title: string; meta: string }
> = {
  classic: {
    section: "text-[11px] tracking-[0.14em]",
    body: "text-[12px]",
    title: "text-[13px]",
    meta: "text-[11px]",
  },
  modern: {
    section: "text-[10px] tracking-[0.16em]",
    body: "text-[12px]",
    title: "text-[13px]",
    meta: "text-[11px]",
  },
  compact: {
    section: "text-[9px] tracking-[0.12em]",
    body: "text-[10.5px]",
    title: "text-[11.5px]",
    meta: "text-[9.5px]",
  },
  executive: {
    section: "text-[11px] tracking-[0.18em]",
    body: "text-[12.5px]",
    title: "text-[14px]",
    meta: "text-[11px]",
  },
  minimal: {
    section: "text-[10px] tracking-[0.2em]",
    body: "text-[11.5px]",
    title: "text-[12px]",
    meta: "text-[10px]",
  },
};

export function ResumeBodySections({
  density = "classic",
  accentClass = "text-teal-700 hover:text-teal-900",
  ruleClass = "border-slate-800",
  hideSkills = false,
  hideExperience = false,
  hideSummary = false,
  hideEducation = false,
}: {
  density?: Density;
  accentClass?: string;
  ruleClass?: string;
  hideSkills?: boolean;
  hideExperience?: boolean;
  hideSummary?: boolean;
  hideEducation?: boolean;
}) {
  const { resume, patch } = useResumePatch();
  const t = densityText[density];
  const sectionGap =
    density === "compact" || density === "minimal" ? "mb-2.5" : "mb-4";
  const jobGap =
    density === "compact" || density === "minimal" ? "space-y-2.5" : "space-y-4";

  return (
    <>
      {!hideSummary && (
      <section className={sectionGap}>
        <h2
          className={`mb-2 border-b ${ruleClass} pb-1 font-bold uppercase text-slate-800 ${t.section}`}
        >
          Summary
        </h2>
        <EditableText
          as="p"
          multiline
          value={resume.summary}
          onChange={(summary) => patch((current) => ({ ...current, summary }))}
          placeholder="A brief professional summary highlighting your impact and strengths."
          className={`block leading-relaxed text-slate-700 ${t.body}`}
        />
      </section>
      )}

      {!hideExperience && (
      <section className={sectionGap}>
        <div className={`mb-2 flex items-end justify-between border-b ${ruleClass} pb-1`}>
          <h2 className={`font-bold uppercase text-slate-800 ${t.section}`}>
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
            className={`text-[10px] font-medium ${accentClass}`}
          >
            + Add role
          </button>
        </div>

        {resume.work_experience.length === 0 && (
          <p className="text-[11px] italic text-slate-400">
            No roles yet — describe them in chat, or add one here.
          </p>
        )}

        <div className={jobGap}>
          {resume.work_experience.map((job, jobIndex) => (
            <div key={job.id} className="group/job relative">
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
                  className={`font-semibold text-slate-900 ${t.title}`}
                />
                <div className={`flex items-center gap-1 text-slate-500 ${t.meta}`}>
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
                className={`mt-0.5 block font-medium text-slate-700 ${t.body}`}
              />
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {job.bullet_points.map((bullet, bulletIndex) => (
                  <li
                    key={`${job.id}-${bulletIndex}`}
                    className={`text-slate-700 ${t.body}`}
                  >
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
                className={`mt-1 text-[10px] font-medium ${accentClass}`}
              >
                + Add bullet
              </button>
            </div>
          ))}
        </div>
      </section>
      )}

      {!hideSkills && (
      <section className={sectionGap}>
        <h2
          className={`mb-2 border-b ${ruleClass} pb-1 font-bold uppercase text-slate-800 ${t.section}`}
        >
          Skills
        </h2>
        <div className={`space-y-1.5 text-slate-700 ${t.body}`}>
          <div>
            <span className="font-semibold text-slate-800">Technical: </span>
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
              placeholder="React, TypeScript, PostgreSQL…"
              className="inline"
            />
          </div>
          <div>
            <span className="font-semibold text-slate-800">Soft: </span>
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
              placeholder="Leadership, Communication…"
              className="inline"
            />
          </div>
        </div>
      </section>
      )}

      {!hideEducation && (
      <section>
        <div className={`mb-2 flex items-end justify-between border-b ${ruleClass} pb-1`}>
          <h2 className={`font-bold uppercase text-slate-800 ${t.section}`}>
            Education
          </h2>
          <button
            type="button"
            onClick={() =>
              patch((current) => ({
                ...current,
                education: [...current.education, newEducation()],
              }))
            }
            className={`text-[10px] font-medium ${accentClass}`}
          >
            + Add education
          </button>
        </div>

        {resume.education.length === 0 && (
          <p className="text-[11px] italic text-slate-400">
            Optional — add school details here, or skip in chat.
          </p>
        )}

        <div
          className={
            density === "compact" || density === "minimal"
              ? "space-y-2"
              : "space-y-3"
          }
        >
          {resume.education.map((edu, eduIndex) => (
            <div key={edu.id} className="group/edu relative">
              <button
                type="button"
                onClick={() =>
                  patch((current) => ({
                    ...current,
                    education: current.education.filter(
                      (item) => item.id !== edu.id,
                    ),
                  }))
                }
                className="absolute -right-1 -top-1 hidden rounded bg-white px-1.5 py-0.5 text-[10px] text-red-600 ring-1 ring-red-200 group-hover/edu:block"
              >
                Remove
              </button>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <EditableText
                  value={edu.institution}
                  onChange={(institution) =>
                    patch((current) => {
                      const education = [...current.education];
                      education[eduIndex] = {
                        ...education[eduIndex],
                        institution,
                      };
                      return { ...current, education };
                    })
                  }
                  placeholder="Institution"
                  className={`font-semibold text-slate-900 ${t.title}`}
                />
                <EditableText
                  value={edu.graduation_year}
                  onChange={(graduation_year) =>
                    patch((current) => {
                      const education = [...current.education];
                      education[eduIndex] = {
                        ...education[eduIndex],
                        graduation_year,
                      };
                      return { ...current, education };
                    })
                  }
                  placeholder="Year"
                  className={`text-slate-500 ${t.meta}`}
                />
              </div>
              <EditableText
                value={edu.degree}
                onChange={(degree) =>
                  patch((current) => {
                    const education = [...current.education];
                    education[eduIndex] = { ...education[eduIndex], degree };
                    return { ...current, education };
                  })
                }
                placeholder="Degree / Field of study"
                className={`mt-0.5 block text-slate-700 ${t.body}`}
              />
            </div>
          ))}
        </div>
      </section>
      )}
    </>
  );
}

export function ContactLine({
  align = "center",
  className = "",
}: {
  align?: "center" | "left";
  className?: string;
}) {
  const { resume, patch } = useResumePatch();
  const info = resume.personal_info;
  const justify = align === "center" ? "justify-center" : "justify-start";

  return (
    <>
      <div
        className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600 ${justify} ${className}`}
      >
        <EditableText
          value={info.email}
          onChange={(email) =>
            patch((current) => ({
              ...current,
              personal_info: { ...current.personal_info, email },
            }))
          }
          placeholder="email@example.com"
        />
        <span aria-hidden>•</span>
        <EditableText
          value={info.phone}
          onChange={(phone) =>
            patch((current) => ({
              ...current,
              personal_info: { ...current.personal_info, phone },
            }))
          }
          placeholder="(555) 000-0000"
        />
        <span aria-hidden>•</span>
        <EditableText
          value={info.location}
          onChange={(location) =>
            patch((current) => ({
              ...current,
              personal_info: { ...current.personal_info, location },
            }))
          }
          placeholder="City, Country"
        />
      </div>
      <div
        className={`mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-600 ${justify}`}
      >
        <EditableText
          value={info.linkedin_url ?? ""}
          onChange={(linkedin_url) =>
            patch((current) => ({
              ...current,
              personal_info: {
                ...current.personal_info,
                linkedin_url: linkedin_url || undefined,
              },
            }))
          }
          placeholder="LinkedIn URL"
        />
        <span aria-hidden>•</span>
        <EditableText
          value={info.github_url ?? ""}
          onChange={(github_url) =>
            patch((current) => ({
              ...current,
              personal_info: {
                ...current.personal_info,
                github_url: github_url || undefined,
              },
            }))
          }
          placeholder="GitHub URL"
        />
      </div>
    </>
  );
}
