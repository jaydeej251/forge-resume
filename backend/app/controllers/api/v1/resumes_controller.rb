module Api
  module V1
    class ResumesController < ApplicationController
      before_action :authenticate_user!, only: [ :index ]
      before_action :set_resume, only: [ :show, :update ]

      def index
        resumes = current_user.resumes.order(updated_at: :desc)
        render json: { resumes: resumes.map { |resume| ResumeResponse.summary(resume) } }
      end

      def create
        resume = Resume.new(template: create_template_param)
        resume.user = current_user if current_user
        if resume.save
          render json: ResumeResponse.call(resume), status: :created
        else
          render json: { errors: resume.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def show
        return unless authorize_resume!(@resume)

        repair_corrupt_resume_data!
        render json: ResumeResponse.call(@resume)
      end

      def update
        return unless authorize_resume!(@resume)

        if @resume.processing?
          return render json: { error: "Resume is being updated by the AI assistant" },
                        status: :conflict
        end

        attrs = {}

        if params[:data].present?
          incoming = resume_data_params
          if ResumeDataSanitizer.heavily_corrupt?(incoming)
            return render json: {
              error: "Rejected corrupt resume payload. Refresh and try again.",
              data: @resume.data
            }, status: :unprocessable_entity
          end
          attrs[:data] = ResumeDataSanitizer.call(incoming, previous: @resume.data)
        end

        if params[:current_step].present?
          attrs[:current_step] = params.require(:current_step)
        end

        if params[:template].present?
          attrs[:template] = params.require(:template)
        end

        if attrs.empty?
          return render json: ResumeResponse.call(@resume)
        end

        if @resume.update(attrs)
          render json: ResumeResponse.call(@resume)
        else
          render json: { errors: @resume.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_resume
        @resume = Resume.find_by!(session_id: params[:session_id])
      end

      def create_template_param
        value = params[:template].presence || "classic"
        value.to_s.downcase
      end

      def resume_data_params
        params.require(:data).permit!.to_h
      end

      def repair_corrupt_resume_data!
        return unless ResumeDataSanitizer.heavily_corrupt?(@resume.data)

        cleaned = ResumeDataSanitizer.call(@resume.data, previous: Resume::EMPTY_STATE)
        extracted = ResumeDataSanitizer.call(@resume.data, previous: @resume.data)
        @resume.update_columns(
          data: extracted.presence || cleaned,
          updated_at: Time.current
        )
        @resume.reload
        Rails.logger.warn("[ResumesController] Repaired corrupt resume ##{@resume.id}")
      end
    end
  end
end
