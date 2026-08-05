# frozen_string_literal: true

module ResumeStepMachine
  extend ActiveSupport::Concern

  # Fast guided flow (not field-by-field interview):
  # 1) basics — name, email, target role → AI drafts summary + skills
  # 2) experience — user dumps roles → AI writes bullets
  # 3) education — finalize (or skip)
  STEPS = %w[basics experience education].freeze

  STEP_LABELS = {
    "basics" => "Basics",
    "experience" => "Experience",
    "education" => "Education"
  }.freeze

  STEP_PROMPTS = {
    "basics" => <<~TEXT.freeze,
      Let's build your resume fast.
      Tell me your full name, email, and the role you're applying for
      (example: "I'm Jane Doe, jane@email.com, applying for Software Engineer").

      I'll draft a professional summary and suggested skills for that role.
      You can tweak anything on the live preview to the right.
    TEXT
    "experience" => <<~TEXT.freeze,
      Step 2 — Experience.
      Paste a role in any format (company, title, dates, rough duties).
      Even a short note is enough — I'll expand it into about 5 strong bullets
      (3 key + 2 supporting). Add more roles anytime, then say "done".
    TEXT
    "education" => <<~TEXT.freeze
      Final step — Education.
      Add school, degree, and year (rough notes are fine), or type "skip" to finish.
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
    payload = data.is_a?(Hash) ? data : {}

    case step.to_s
    when "basics"
      info = payload["personal_info"] || {}
      info["full_name"].to_s.strip.present? &&
        info["email"].to_s.strip.present? &&
        info["target_role"].to_s.strip.present? &&
        payload["summary"].to_s.strip.present?
    when "experience"
      Array(payload["work_experience"]).any? do |job|
        job["company"].to_s.strip.present? && job["position"].to_s.strip.present?
      end
    when "education"
      Array(payload["education"]).any? { |edu| edu["institution"].to_s.strip.present? }
    else
      false
    end
  end

  def advance_step_if_allowed!(advance_requested:, user_message: "")
    return false if last_step?

    skip_requested = user_message.to_s.match?(/\bskip\b/i)
    ready = requirements_met_for?(current_step) || (current_step == "education" && skip_requested)
    return false unless ready

    explicit_continue = advance_requested ||
      user_message.to_s.match?(/\b(next|continue|done|skip|that'?s all|ready|finish)\b/i)

    should_advance =
      case current_step
      when "basics"
        ready
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
