module Api
  module V1
    class MessagesController < ApplicationController
      include ActionController::Live

      before_action :set_resume

      # Sync SSE chat turn (primary Phase 4 path).
      def stream
        content = params[:content].to_s

        response.headers["Content-Type"] = "text/event-stream"
        response.headers["Cache-Control"] = "no-cache, no-store"
        response.headers["Connection"] = "keep-alive"
        response.headers["X-Accel-Buffering"] = "no"

        stream_writer = lambda do |event, data|
          response.stream.write("event: #{event}\ndata: #{JSON.generate(data)}\n\n")
        end

        SseMessageProcessor.new(
          resume: @resume,
          content: content,
          stream: stream_writer
        ).call
      rescue IOError
        # Client disconnected mid-stream.
        @resume&.update(llm_status: "idle") if @resume&.processing?
      ensure
        response.stream.close
      end

      # Non-streaming fallback (queued job) for clients that cannot hold an SSE POST open.
      def create
        content = params.require(:content).to_s.strip
        if content.blank?
          return render json: { error: "content is required" }, status: :unprocessable_entity
        end
        if content.length > Resume::MAX_MESSAGE_LENGTH
          return render json: { error: "content too long" }, status: :unprocessable_entity
        end
        if @resume.processing?
          return render json: { error: "Already processing a message" }, status: :conflict
        end

        user_message = nil
        assistant_message = nil

        ActiveRecord::Base.transaction do
          user_message = @resume.resume_messages.create!(
            role: "user",
            content: content,
            status: "completed"
          )
          assistant_message = @resume.resume_messages.create!(
            role: "assistant",
            content: "",
            status: "pending"
          )
          @resume.update!(llm_status: "processing", llm_error: nil)
        end

        EnhanceResumeJob.perform_later(@resume.id, user_message.id, assistant_message.id)

        render json: {
          status: "processing",
          session_id: @resume.session_id,
          user_message_id: user_message.id,
          assistant_message_id: assistant_message.id
        }, status: :accepted
      end

      private

      def set_resume
        @resume = Resume.find_by!(session_id: params[:resume_session_id])
      end
    end
  end
end
