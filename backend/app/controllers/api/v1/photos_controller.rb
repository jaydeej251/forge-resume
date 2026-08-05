# frozen_string_literal: true

module Api
  module V1
    class PhotosController < ApplicationController
      before_action :set_resume

      def create
        unless params[:photo].present?
          return render json: { error: "photo is required" }, status: :unprocessable_entity
        end

        @resume.photo.attach(params[:photo])
        if @resume.valid? && @resume.photo.attached?
          render json: ResumeResponse.call(@resume)
        else
          @resume.photo.purge if @resume.photo.attached?
          render json: { errors: @resume.errors.full_messages.presence || [ "Invalid photo" ] },
                 status: :unprocessable_entity
        end
      end

      def destroy
        @resume.photo.purge if @resume.photo.attached?
        render json: ResumeResponse.call(@resume.reload)
      end

      private

      def set_resume
        @resume = Resume.find_by!(session_id: params[:resume_session_id])
      end
    end
  end
end
