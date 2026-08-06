# frozen_string_literal: true

# Orchestrates a single chat turn over SSE: structured LLM update, then
# streams the assistant reply in small chunks for a live chat feel.
class SseMessageProcessor
  TOKEN_DELAY = 0.02

  def initialize(resume:, content:, stream:)
    @resume = resume
    @content = content.to_s.strip
    @stream = stream
  end

  def call
    validate_content!

    user_message = nil
    assistant_message = nil

    ActiveRecord::Base.transaction do
      user_message = @resume.resume_messages.create!(
        role: "user",
        content: @content,
        status: "completed"
      )
      assistant_message = @resume.resume_messages.create!(
        role: "assistant",
        content: "",
        status: "pending"
      )
      @resume.update!(llm_status: "processing", llm_error: nil)
    end

    emit("message_start", {
      user_message: ResumeResponse.message_json(user_message),
      assistant_message: ResumeResponse.message_json(assistant_message),
      current_step: @resume.current_step,
      step_index: @resume.step_index,
      step_label: @resume.step_label,
      total_steps: @resume.total_steps
    })
    emit("status", { message: "Updating your resume…" })

    result = ResumeEnhancer.new(resume: @resume, user_message: @content).call
    emit("status", { message: result[:skipped_llm] ? "Saving progress…" : "Writing resume copy…" })

    @resume.update!(
      data: result[:resume_data],
      llm_error: nil
    )

    advanced = @resume.advance_step_if_allowed!(
      advance_requested: result[:advance_step],
      user_message: @content
    )

    assistant_text = result[:assistant_message].presence || default_assistant_text(advanced)
    if advanced
      assistant_text = "#{assistant_text}\n\n#{@resume.welcome_prompt.strip}"
    end

    stream_tokens(assistant_text)

    assistant_message.update!(content: assistant_text, status: "completed")
    @resume.update!(llm_status: "idle", llm_error: nil)

    flow_complete = flow_complete?

    emit("resume", { data: @resume.data })
    emit("step", {
      current_step: @resume.current_step,
      step_index: @resume.step_index,
      step_label: @resume.step_label,
      total_steps: @resume.total_steps,
      advanced: advanced,
      flow_complete: flow_complete
    })
    emit("assistant_done", ResumeResponse.message_json(assistant_message.reload))
    emit("done", { llm_status: "idle", flow_complete: flow_complete })
  rescue StandardError => e
    handle_failure(assistant_message, e)
  end

  private

  def validate_content!
    raise ArgumentError, "content is required" if @content.blank?
    if @content.length > Resume::MAX_MESSAGE_LENGTH
      raise ArgumentError, "content must be #{Resume::MAX_MESSAGE_LENGTH} characters or fewer"
    end
    raise ArgumentError, "Already processing a message" if @resume.processing?
  end

  def stream_tokens(text)
    text.scan(/\S+|\s+/).each do |piece|
      emit("token", { content: piece })
      sleep TOKEN_DELAY
    end
  end

  def default_assistant_text(advanced)
    if advanced
      "Got it — moving on."
    else
      "Updated your resume."
    end
  end

  def flow_complete?
    @resume.flow_complete? || (
      @resume.last_step? && (
        @resume.requirements_met_for?("education") || @content.match?(/\bskip\b/i)
      )
    )
  end

  def handle_failure(assistant_message, error)
    message = error.message.to_s.truncate(500)
    @resume&.update(llm_status: "failed", llm_error: message)
    if assistant_message
      assistant_message.update(
        content: "Sorry — I couldn't update the resume. #{message}",
        status: "failed"
      )
    end
    emit("error", { message: message, llm_status: "failed" })
  end

  def emit(event, data)
    @stream.call(event, data)
  end
end
