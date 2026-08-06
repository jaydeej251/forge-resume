# frozen_string_literal: true

module Api
  module V1
    module Admin
      class UserResumesController < BaseController
        def destroy
          user = User.find(params[:user_id])
          resume = user.resumes.find_by!(session_id: params[:session_id])
          resume.destroy!
          head :no_content
        end
      end
    end
  end
end
