# frozen_string_literal: true

class EnhanceResumeJob < ApplicationJob
  queue_as :default

  def perform(resume_id, user_message_id, assistant_message_id)
    resume = Resume.find(resume_id)
    user_message = resume.resume_messages.find(user_message_id)
    assistant_message = resume.resume_messages.find(assistant_message_id)

    result = ResumeEnhancer.new(
      resume: resume,
      user_message: user_message.content
    ).call

    resume.update!(
      data: result[:resume_data],
      llm_error: nil
    )

    advanced = resume.advance_step_if_allowed!(
      advance_requested: result[:advance_step],
      user_message: user_message.content
    )

    text = result[:assistant_message].presence || "Updated your resume."
    text = "#{text}\n\n#{resume.welcome_prompt.strip}" if advanced

    assistant_message.update!(content: text, status: "completed")
    resume.update!(llm_status: "idle", llm_error: nil)
  rescue StandardError => e
    resume&.update(llm_status: "failed", llm_error: e.message)
    assistant_message&.update(
      content: "Sorry — I couldn't update the resume. #{e.message}",
      status: "failed"
    )
    raise if Rails.env.test?
  end
end
