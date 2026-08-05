# frozen_string_literal: true

module Api
  module V1
    class AuthController < ApplicationController
      before_action :authenticate_user!, only: [ :me, :claim ]

      def signup
        user = User.new(
          email: params.require(:email),
          name: params[:name].to_s.strip,
          password: params.require(:password),
          provider: "email"
        )

        unless user.save
          return render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end

        render_auth_success(user, claim: true)
      rescue ActionController::ParameterMissing => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue Resume::AlreadyOwnedError
        render json: { error: "That resume is already linked to another account" }, status: :forbidden
      end

      def login
        user = User.find_by(email: params.require(:email).to_s.strip.downcase)
        unless user&.authenticate(params.require(:password).to_s)
          return render json: { error: "Invalid email or password" }, status: :unauthorized
        end

        render_auth_success(user, claim: true)
      rescue ActionController::ParameterMissing => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue Resume::AlreadyOwnedError
        render json: { error: "That resume is already linked to another account" }, status: :forbidden
      end

      def google
        payload = GoogleIdTokenVerifier.verify!(params.require(:id_token))
        email = payload[:email].to_s.strip.downcase
        raise GoogleIdTokenVerifier::Error, "email missing from Google token" if email.blank?

        user = User.find_by(google_uid: payload[:sub]) || User.find_by(email: email)
        if user
          user.update!(
            google_uid: payload[:sub],
            provider: user.password_digest.present? && user.provider == "email" ? "email" : "google",
            name: user.name.presence || payload[:name].to_s
          )
        else
          user = User.new(
            email: email,
            name: payload[:name].to_s.presence || email.split("@").first,
            google_uid: payload[:sub],
            provider: "google"
          )
          user.password = SecureRandom.hex(32)
          user.save!
        end

        render_auth_success(user, claim: true)
      rescue ActionController::ParameterMissing => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue GoogleIdTokenVerifier::Error => e
        render json: { error: e.message }, status: :unauthorized
      rescue Resume::AlreadyOwnedError
        render json: { error: "That resume is already linked to another account" }, status: :forbidden
      end

      def me
        render json: { user: current_user.as_public_json }
      end

      def claim
        resume = claim_session_if_present!(current_user, params.require(:session_id))
        unless resume
          return render json: { error: "Resume not found" }, status: :not_found
        end

        render json: {
          user: current_user.as_public_json,
          resume: ResumeResponse.summary(resume)
        }
      rescue ActionController::ParameterMissing => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue Resume::AlreadyOwnedError
        render json: { error: "That resume is already linked to another account" }, status: :forbidden
      end

      private

      def render_auth_success(user, claim:)
        claimed = claim ? claim_session_if_present!(user) : nil
        render json: {
          token: JsonWebToken.encode(user),
          user: user.as_public_json,
          claimed_session_id: claimed&.session_id
        }
      end
    end
  end
end
