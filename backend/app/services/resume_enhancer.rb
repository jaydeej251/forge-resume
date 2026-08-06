# frozen_string_literal: true

class ResumeEnhancer
  BASE_SYSTEM_PROMPT = <<~PROMPT.freeze
    You are a fast resume coach in a split-screen builder (chat left, live resume right).
    Batch facts — do not interview field-by-field. Keep assistant_message short.
    Return STRICT JSON matching the schema only.

    Rules:
    1. Never invent name/email/phone/URLs/employers/schools the user did not give.
       You MAY draft summary/skills for a stated target_role when that stage asks for it.
    2. Preserve existing content unless the user is clearly updating it.
    3. Keep work_experience/education ids; new rows get UUID v4.
    4. Per role: prefer exactly 5 bullets (3 essential + 2 supporting). Strong verbs;
       no fabricated metrics/tools/employers. If dates are unknown, use empty strings —
       never the literal words null/undefined/N/A.
    5. Skills are short labels only.
    6. Optional personal_info fields (phone, location, linkedin_url, github_url): omit or
       use "" when the user did not provide them — never invent and never emit "null".
  PROMPT

  STEP_FOCUS = {
    "basics" => <<~TEXT.freeze,
      STAGE 1 — Basics: need full_name, email, target_role (optional phone/location).
      Do NOT draft a long summary or skills list yet — later stages cover those.
      When name/email/target_role are present: set personal_info, set advance_step=true,
      invite them to the summary step next.
      If missing fields, ask for name + email + target role in ONE message.
    TEXT
    "summary" => <<~TEXT.freeze,
      STAGE 2 — Summary: draft or refine a 2–4 sentence professional summary for target_role.
      Use known personal_info + any experience already on the resume. Do not invent employers.
      If summary is empty, write a strong draft and ask them to tweak or say "looks good".
      If they approve (looks good / continue / next) and summary is non-empty: advance_step=true.
      If they request edits, update summary and ask again — advance_step=false until they approve
      or clearly provide a finished summary and want to move on.
    TEXT
    "skills" => <<~TEXT.freeze,
      STAGE 3 — Skills: fill skills.technical and skills.soft with short labels for the role.
      If skills are empty, suggest a focused list and ask them to add/remove or say "looks good".
      If they approve and at least one skill exists: advance_step=true.
      Preserve personal_info/summary unless the user corrects them.
    TEXT
    "experience" => <<~TEXT.freeze,
      STAGE 4 — Experience: parse messy role notes into company/title/dates + 5 bullets.
      If user only signals done/continue (not adding a role): copy work_experience unchanged,
      set advance_step=true, invite education next.
      Else expand touched roles to 5 bullets; ask to add another role or type "done".
    TEXT
    "education" => <<~TEXT.freeze
      STAGE 5 — Education: add school/degree/year or accept skip.
      Preserve personal_info/summary/skills/work_experience unless user corrects them.
      Set advance_step=true when education is added or user skips; congratulate + mention they
      can keep chatting to polish, edit the canvas, or download PDF.
    TEXT
  }.freeze

  POLISH_FOCUS = <<~TEXT.freeze
    POLISH MODE — the guided flow is complete. Keep refining whatever the user asks:
    summary wording, skills, roles/bullets, education, contact details.
    Preserve sections they did not mention. Set advance_step=false always.
    Keep assistant_message short and confirm what changed.
  TEXT

  # Exact/near-exact control phrases — no LLM needed.
  CONTROL_DONE = /\A\s*(?:i(?:'m| am)\s+)?(?:done|finished)(?:\s+(?:here|for now|adding(?:\s+roles?)?|with\s+(?:experience|this|roles?)))?\s*[.!]?\s*\z/i
  CONTROL_CONTINUE = /\A\s*(?:continue|next|that'?s all|thats all|ready|finish|looks good)\s*[.!]?\s*\z/i
  CONTROL_SKIP = /\A\s*skip(?:\s+(?:education|this|it))?\s*[.!]?\s*\z/i

  def initialize(resume:, user_message:)
    @resume = resume
    @user_message = user_message
  end

  def call
    if (fast = fast_path_result)
      return fast
    end

    ensure_api_key!

    previous = deep_copy(@resume.data)
    model = ENV.fetch("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    chat = RubyLLM.chat(model: model, provider: :openrouter)
    chat.with_instructions(system_prompt)
    response = chat.with_schema(ResumeEnhancementSchema).ask(user_prompt)

    payload = normalize_payload(response.content)
    resume_data = ensure_ids(payload.fetch("resume"))
    resume_data = ResumeDataSanitizer.call(resume_data, previous: previous)

    if done_signal? && ResumeDataSanitizer.heavily_corrupt?(payload["resume"])
      resume_data["work_experience"] = previous["work_experience"]
    end

    {
      resume_data: resume_data,
      assistant_message: sanitize_assistant_message(payload.fetch("assistant_message")),
      advance_step: polish_mode? ? false : (ActiveModel::Type::Boolean.new.cast(payload["advance_step"]) || done_signal?),
      skipped_llm: false
    }
  end

  private

  def polish_mode?
    @resume.flow_complete?
  end

  def fast_path_result
    step = @resume.current_step

    if polish_mode? && experience_done_phrase?
      return {
        resume_data: deep_copy(@resume.data),
        assistant_message: "Your draft is already ready. Tell me what to tweak (summary, skills, a role, or education), or download the PDF anytime.",
        advance_step: false,
        skipped_llm: true
      }
    end

    if %w[summary skills].include?(step) && approval_phrase? && @resume.requirements_met_for?(step)
      next_label = step == "summary" ? "skills" : "experience"
      return {
        resume_data: deep_copy(@resume.data),
        assistant_message: "Locked in. Next up is #{next_label}.",
        advance_step: true,
        skipped_llm: true
      }
    end

    if step == "experience" && experience_done_phrase? && @resume.requirements_met_for?("experience")
      return {
        resume_data: deep_copy(@resume.data),
        assistant_message: "Great — experience looks solid. Next is education (or type skip if you want to finish without it).",
        advance_step: true,
        skipped_llm: true
      }
    end

    if step == "education" && !polish_mode? && skip_phrase?
      return {
        resume_data: deep_copy(@resume.data),
        assistant_message: "All set — your resume is ready. Keep chatting to polish anything, fine-tune the preview, or download your PDF.",
        advance_step: true,
        skipped_llm: true
      }
    end

    nil
  end

  def system_prompt
    step = @resume.current_step
    focus = polish_mode? ? POLISH_FOCUS : STEP_FOCUS.fetch(step)
    <<~PROMPT
      #{BASE_SYSTEM_PROMPT}

      CURRENT STAGE: #{step} (#{@resume.step_index + 1}/#{@resume.total_steps})#{polish_mode? ? " — polish mode" : ""}
      #{focus}
      MISSING: #{@resume.missing_fields_for.join(", ").presence || "none"}
    PROMPT
  end

  def ensure_api_key!
    key = ENV["OPENROUTER_API_KEY"].to_s.strip
    if key.blank? || key == "your-openrouter-api-key-here"
      raise "OPENROUTER_API_KEY is not configured. Add it to backend/.env and restart Rails."
    end
  end

  def user_prompt
    data = compact_resume_for_prompt(@resume.data)

    hint =
      if polish_mode?
        "Flow complete. Apply only the edits the user asked for. advance_step=false."
      else
        case @resume.current_step
        when "basics"
          "Fill personal_info only. Do not invent summary/skills yet. advance_step when name/email/target_role present."
        when "summary"
          if approval_phrase? && @resume.requirements_met_for?("summary")
            "User approved the summary. Keep summary. advance_step=true."
          else
            "Draft or refine summary for the target role. Invite approval with looks good."
          end
        when "skills"
          if approval_phrase? && @resume.requirements_met_for?("skills")
            "User approved skills. Keep skills. advance_step=true."
          else
            "Draft or refine skills.technical and skills.soft. Invite approval with looks good."
          end
        when "experience"
          if done_signal?
            "User is finishing Experience. Copy work_experience unchanged. advance_step=true."
          else
            "Expand touched roles to exactly 5 bullet_points. Leave untouched roles identical."
          end
        when "education"
          "Only update education (or skip). Preserve other sections from ResumeState."
        else
          ""
        end
      end

    <<~PROMPT
      ResumeState: #{JSON.generate(data)}
      Stage: #{@resume.current_step} | ready?: #{@resume.requirements_met_for?} | polish?: #{polish_mode?}
      #{hint}
      User: #{@user_message}
    PROMPT
  end

  # Drop empty optional noise to cut tokens; keep structure the model must return.
  def compact_resume_for_prompt(raw)
    data = deep_copy(raw)
    info = data["personal_info"] || {}
    %w[phone location linkedin_url github_url].each do |key|
      info.delete(key) if info[key].to_s.strip.blank?
    end
    data["personal_info"] = info
    data["summary"] = data["summary"].to_s
    data["work_experience"] = Array(data["work_experience"])
    data["education"] = Array(data["education"])
    skills = data["skills"] || {}
    data["skills"] = {
      "technical" => Array(skills["technical"]),
      "soft" => Array(skills["soft"])
    }
    data
  end

  def experience_done_phrase?
    CONTROL_DONE.match?(@user_message.to_s) || CONTROL_CONTINUE.match?(@user_message.to_s)
  end

  def approval_phrase?
    @user_message.to_s.match?(/\A\s*(?:looks good|lgtm|good|ok|okay|continue|next|ready|done)\s*[.!]?\s*\z/i)
  end

  def skip_phrase?
    CONTROL_SKIP.match?(@user_message.to_s)
  end

  def done_signal?
    experience_done_phrase? || skip_phrase? ||
      @user_message.to_s.match?(/\b(done|continue|next|skip|that'?s all|ready|finish|looks good)\b/i)
  end

  def sanitize_assistant_message(message)
    text = message.to_s.strip
    text = text.split(/\}{2,}/).first.to_s.strip if text.count("}") > 2
    text = "Updated your resume." if text.blank? || ResumeDataSanitizer.corrupt?(text)
    text.truncate(1_200)
  end

  def normalize_payload(content)
    case content
    when Hash
      content.deep_stringify_keys
    when String
      JSON.parse(content)
    else
      raise "Unexpected LLM response type: #{content.class}"
    end
  rescue JSON::ParserError => e
    raise "Model returned invalid JSON: #{e.message}"
  end

  def ensure_ids(resume_data)
    data = resume_data.deep_stringify_keys

    info = (data["personal_info"] || {}).deep_stringify_keys
    info["target_role"] = info["target_role"].to_s
    data["personal_info"] = info

    data["work_experience"] = Array(data["work_experience"]).map do |item|
      next unless item.is_a?(Hash)

      item = item.deep_stringify_keys
      item["id"] = SecureRandom.uuid if item["id"].blank?
      item["bullet_points"] = Array(item["bullet_points"]).map(&:to_s)
      item["current"] = ActiveModel::Type::Boolean.new.cast(item["current"])
      item
    end.compact

    data["education"] = Array(data["education"]).map do |item|
      next unless item.is_a?(Hash)

      item = item.deep_stringify_keys
      item["id"] = SecureRandom.uuid if item["id"].blank?
      item
    end.compact

    skills = (data["skills"] || {}).deep_stringify_keys
    data["skills"] = {
      "technical" => Array(skills["technical"]).map(&:to_s),
      "soft" => Array(skills["soft"]).map(&:to_s)
    }

    data
  end

  def deep_copy(value)
    JSON.parse(JSON.generate(value || {}))
  end
end
