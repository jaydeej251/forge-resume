export const RESUME_STEPS = [
  "basics",
  "experience",
  "education",
] as const;

export type ResumeStep = (typeof RESUME_STEPS)[number];

export const STEP_LABELS: Record<ResumeStep, string> = {
  basics: "Basics",
  experience: "Experience",
  education: "Education",
};

export const STEP_HINTS: Record<ResumeStep, string> = {
  basics: "Name, email, and target role — we'll draft summary & skills",
  experience: "Paste a role — we'll expand it into ~5 bullets (3 key + 2 supporting)",
  education: "Add education, or skip to finish",
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
