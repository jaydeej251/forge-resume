import type { ResumeState } from "@/types/resume";

/** Normalize LLM/json nullish junk so UI never shows the word "null". */
export function cleanDisplayText(value: unknown): string {
  if (value == null) return "";
  const text = String(value).replace(/\u00a0/g, " ").trim();
  if (!text) return "";
  if (/^(null|undefined|nil|none|n\/a)$/i.test(text)) return "";
  return text;
}

const DEGREE_TOKENS: Record<string, string> = {
  bs: "BS",
  ba: "BA",
  bsc: "BSc",
  ms: "MS",
  ma: "MA",
  msc: "MSc",
  mba: "MBA",
  phd: "PhD",
  "phd.": "PhD",
  bachelors: "Bachelor's",
  "bachelor's": "Bachelor's",
  masters: "Master's",
  "master's": "Master's",
};


/**
 * Title-case each word (spaces, hyphens, slashes).
 * "john doe" → "John Doe", "sales engineer" → "Sales Engineer".
 */
export function titleCaseWords(value: unknown): string {
  const text = cleanDisplayText(value);
  if (!text) return "";

  return text
    .split(/(\s+|[-/&,])/g)
    .map((token) => {
      if (!token || /^\s+$/.test(token) || /^[-/&,]$/.test(token)) {
        return token;
      }
      return titleCaseToken(token);
    })
    .join("");
}

function titleCaseToken(token: string): string {
  const lower = token.toLowerCase();
  if (DEGREE_TOKENS[lower]) return DEGREE_TOKENS[lower];

  // Preserve short ALL-CAPS tech tokens (AWS, SQL, UI) when already uppercase.
  if (token.length <= 5 && /^[A-Z0-9.+#]+$/.test(token) && /[A-Z]/.test(token)) {
    return token;
  }

  return token
    .split(/([.'’])/)
    .map((part) => {
      if (!part || part === "." || part === "'" || part === "’") return part;
      const degree = DEGREE_TOKENS[part.toLowerCase()];
      if (degree) return degree;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

/** Title-case proper-noun resume fields; leave emails, URLs, body copy alone. */
export function formatResumeProperNouns(resume: ResumeState): ResumeState {
  const info = resume.personal_info;

  return {
    ...resume,
    personal_info: {
      ...info,
      full_name: titleCaseWords(info.full_name),
      target_role: titleCaseWords(info.target_role),
      location: titleCaseWords(info.location),
      email: cleanDisplayText(info.email),
      phone: cleanDisplayText(info.phone),
      linkedin_url: cleanDisplayText(info.linkedin_url) || undefined,
      github_url: cleanDisplayText(info.github_url) || undefined,
    },
    work_experience: resume.work_experience.map((job) => ({
      ...job,
      company: titleCaseWords(job.company),
      position: titleCaseWords(job.position),
    })),
    education: resume.education.map((edu) => ({
      ...edu,
      institution: titleCaseWords(edu.institution),
      degree: titleCaseWords(edu.degree),
    })),
    skills: {
      technical: resume.skills.technical
        .map((skill) => titleCaseWords(skill))
        .filter(Boolean),
      soft: resume.skills.soft
        .map((skill) => titleCaseWords(skill))
        .filter(Boolean),
    },
  };
}
