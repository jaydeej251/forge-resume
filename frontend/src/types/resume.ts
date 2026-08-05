export interface PersonalInfo {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  target_role?: string;
  linkedin_url?: string;
  github_url?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  current: boolean;
  bullet_points: string[];
}

export interface Skills {
  technical: string[];
  soft: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  graduation_year: string;
}

export interface ResumeState {
  personal_info: PersonalInfo;
  summary: string;
  work_experience: WorkExperience[];
  skills: Skills;
  education: Education[];
}

export const EMPTY_RESUME_STATE: ResumeState = {
  personal_info: {
    full_name: "",
    email: "",
    phone: "",
    location: "",
    target_role: "",
    linkedin_url: undefined,
    github_url: undefined,
  },
  summary: "",
  work_experience: [],
  skills: {
    technical: [],
    soft: [],
  },
  education: [],
};

export function createEmptyResumeState(): ResumeState {
  return structuredClone(EMPTY_RESUME_STATE);
}
