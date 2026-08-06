# frozen_string_literal: true

class ApplicationController < ActionController::API
  private

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = user_from_token
  end

  def authenticate_user!
    render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
  end

  def authenticate_admin!
    unless current_user
      render json: { error: "Unauthorized" }, status: :unauthorized
      return
    end
    unless current_user_admin?
      render json: { error: "Forbidden" }, status: :forbidden
    end
  end

  def current_user_admin?
    current_user&.admin?
  end

  def user_from_token
    header = request.headers["Authorization"].to_s
    token = header.start_with?("Bearer ") ? header.delete_prefix("Bearer ").strip : nil
    return nil if token.blank?

    payload = JsonWebToken.decode(token)
    return nil unless payload

    User.find_by(id: payload[:sub])
  end

  def claim_session_if_present!(user, session_id = params[:session_id])
    return nil if session_id.blank?

    resume = Resume.find_by(session_id: session_id)
    return nil unless resume

    resume.claim_for!(user)
    resume
  rescue Resume::AlreadyOwnedError
    raise
  end

  def authorize_resume!(resume)
    return true if current_user_admin?
    return true if resume.accessible_by?(current_user)

    render json: { error: "Forbidden" }, status: :forbidden
    false
  end
end
