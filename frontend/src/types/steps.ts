export const RESUME_STEPS = [
  "basics",
  "summary",
  "skills",
  "experience",
  "education",
] as const;

export type ResumeStep = (typeof RESUME_STEPS)[number];

export const STEP_LABELS: Record<ResumeStep, string> = {
  basics: "Basics",
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  education: "Education",
};

export const STEP_HINTS: Record<ResumeStep, string> = {
  basics: "Name, email, and target role — we'll draft summary & skills together",
  summary: "Summary is on the canvas — looks good, or generate a new one",
  skills: "Skills are on the canvas — looks good, or generate new skills",
  experience: "Paste a role — we'll expand it into ~5 bullets (3 key + 2 supporting)",
  education: "Add education, or skip to finish — you can keep chatting after",
};

export function isResumeStep(value: string): value is ResumeStep {
  return (RESUME_STEPS as readonly string[]).includes(value);
}

export function isFlowComplete(input: {
  currentStep: ResumeStep;
  hasEducation: boolean;
  messages: Array<{ role: string; content: string }>;
}): boolean {
  if (input.currentStep !== "education") return false;
  if (input.hasEducation) return true;
  return input.messages.some(
    (message) =>
      message.role === "user" && /\bskip\b/i.test(message.content),
  );
}
