# frozen_string_literal: true

module ResumeResponse
  module_function

  def call(resume)
    {
      id: resume.id,
      session_id: resume.session_id,
      data: resume.data,
      template: resume.template,
      photo_url: resume.photo_url,
      llm_status: resume.llm_status,
      llm_error: resume.llm_error,
      current_step: resume.current_step,
      step_index: resume.step_index,
      step_label: resume.step_label,
      total_steps: resume.total_steps,
      messages: resume.resume_messages.order(:created_at).map { |message| message_json(message) }
    }
  end

  def message_json(message)
    {
      id: message.id,
      role: message.role,
      content: message.content,
      status: message.status,
      created_at: message.created_at
    }
  end
end
