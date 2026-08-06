# frozen_string_literal: true

module Api
  module V1
    module Admin
      class UsersController < BaseController
        def index
          users = User
            .left_outer_joins(:resumes)
            .select("users.*, COUNT(resumes.id) AS resumes_count")
            .group("users.id")
            .order(created_at: :desc)

          render json: {
            users: users.map { |user| admin_user_json(user) }
          }
        end

        def resumes
          user = User.find(params[:id])
          rows = user.resumes.order(updated_at: :desc)
          render json: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name
            },
            resumes: rows.map { |resume| ResumeResponse.summary(resume) }
          }
        end

        def destroy
          user = User.find(params[:id])
          if user.id == current_user.id
            return render json: { error: "You can't delete your own admin account from here." },
                          status: :unprocessable_entity
          end

          ActiveRecord::Base.transaction do
            user.resumes.find_each(&:destroy!)
            user.destroy!
          end

          head :no_content
        end

        private

        def admin_user_json(user)
          {
            id: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider,
            created_at: user.created_at,
            resumes_count: user.read_attribute(:resumes_count).to_i,
            is_admin: user.admin?
          }
        end
      end
    end
  end
end
