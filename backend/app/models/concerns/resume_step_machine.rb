# frozen_string_literal: true

module ResumeStepMachine
  extend ActiveSupport::Concern

  # Guided coach flow:
  # 1) basics — name, email, target role
  # 2) summary — draft / refine professional summary
  # 3) skills — draft / refine technical + soft skills
  # 4) experience — roles + bullets (repeatable until "done")
  # 5) education — school/degree or skip; then polish mode stays open
  STEPS = %w[basics summary skills experience education].freeze

  STEP_LABELS = {
    "basics" => "Basics",
    "summary" => "Summary",
    "skills" => "Skills",
    "experience" => "Experience",
    "education" => "Education"
  }.freeze

  STEP_PROMPTS = {
    "basics" => <<~TEXT.freeze,
      Let's build your resume.
      Tell me your full name, email, and the role you're applying for
      (example: "I'm Jane Doe, jane@email.com, applying for Software Engineer").
      I'll draft your summary and skills in one pass for the live canvas.
    TEXT
    "summary" => <<~TEXT.freeze,
      Your professional summary and skills are already on the live canvas.
      For the summary: say "looks good" to continue, or "generate a new summary" for another draft.
      You can also tell me what to emphasize.
    TEXT
    "skills" => <<~TEXT.freeze,
      Suggested skills are on the live canvas.
      Say "looks good" to continue, tell me what to add or remove, or "generate new skills".
    TEXT
    "experience" => <<~TEXT.freeze,
      Step 4 — Experience.
      Paste a role in any format (company, title, dates, rough duties).
      Even a short note is enough — I'll expand it into about 5 strong bullets
      (3 key + 2 supporting). Add more roles anytime, then say "done".
    TEXT
    "education" => <<~TEXT.freeze
      Final step — Education.
      Add school, degree, and year (rough notes are fine), or type "skip" to finish.
      After this you can keep chatting to polish anything on the resume.
    TEXT
  }.freeze

  included do
    validates :current_step, inclusion: { in: STEPS }
  end

  class_methods do
    def step_index(step)
      STEPS.index(step.to_s) || 0
    end

    def step_label(step)
      STEP_LABELS[step.to_s] || step.to_s.humanize
    end
  end

  def step_index
    self.class.step_index(current_step)
  end

  def step_label
    self.class.step_label(current_step)
  end

  def total_steps
    STEPS.length
  end

  def last_step?
    current_step == STEPS.last
  end

  def welcome_prompt
    STEP_PROMPTS.fetch(current_step)
  end

  def seed_welcome_message!
    return if resume_messages.exists?

    resume_messages.create!(
      role: "assistant",
      content: welcome_prompt.strip,
      status: "completed"
    )
  end

  def missing_fields_for(step = current_step)
    payload = data.is_a?(Hash) ? data : {}

    case step.to_s
    when "basics"
      info = payload["personal_info"] || {}
      [].tap do |missing|
        missing << "full_name" if info["full_name"].to_s.strip.blank?
        missing << "email" if info["email"].to_s.strip.blank?
        missing << "target_role" if info["target_role"].to_s.strip.blank?
      end
    when "summary"
      payload["summary"].to_s.strip.present? ? [] : [ "summary" ]
    when "skills"
      skills = payload["skills"] || {}
      tech = Array(skills["technical"]).map { |s| s.to_s.strip }.reject(&:blank?)
      soft = Array(skills["soft"]).map { |s| s.to_s.strip }.reject(&:blank?)
      (tech + soft).any? ? [] : [ "skills" ]
    when "experience"
      Array(payload["work_experience"]).any? { |job|
        job["company"].to_s.strip.present? && job["position"].to_s.strip.present?
      } ? [] : [ "work_history" ]
    when "education"
      Array(payload["education"]).any? { |edu| edu["institution"].to_s.strip.present? } ? [] : [ "education_or_skip" ]
    else
      []
    end
  end

  def requirements_met_for?(step = current_step)
    missing_fields_for(step).empty?
  end

  def education_stage_done?
    return true if requirements_met_for?("education")

    resume_messages.where(role: "user").any? { |message| message.content.to_s.match?(/\bskip\b/i) }
  end

  def flow_complete?
    last_step? && education_stage_done?
  end

  def advance_step_if_allowed!(advance_requested:, user_message: "")
    return false if last_step?
    return false if flow_complete?

    skip_requested = user_message.to_s.match?(/\bskip\b/i)
    ready = requirements_met_for?(current_step) || (current_step == "education" && skip_requested)
    return false unless ready

    explicit_continue = advance_requested ||
      user_message.to_s.match?(/\b(next|continue|done|skip|that'?s all|ready|finish|looks good)\b/i)

    should_advance =
      case current_step
      when "basics"
        ready
      when "summary", "skills"
        # Wait for an explicit user okay after the draft lands.
        ready && user_message.to_s.match?(/\b(next|continue|done|skip|that'?s all|ready|finish|looks good|lgtm|ok|okay)\b/i)
      when "experience"
        # Stay here until user is done adding roles.
        explicit_continue
      when "education"
        ready || skip_requested
      else
        false
      end

    return false unless should_advance

    next_step = STEPS[step_index + 1]
    return false if next_step.blank?

    update!(current_step: next_step)
    true
  end
end
