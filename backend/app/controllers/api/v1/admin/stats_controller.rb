# frozen_string_literal: true

module Api
  module V1
    module Admin
      class StatsController < BaseController
        def show
          owned = Resume.where.not(user_id: nil).count
          total = Resume.count
          render json: {
            users_count: User.count,
            resumes_count: total,
            owned_resumes_count: owned,
            guest_resumes_count: total - owned
          }
        end
      end
    end
  end
end
