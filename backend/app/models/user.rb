# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password validations: false

  PROVIDERS = %w[email google].freeze

  has_many :resumes, dependent: :nullify

  before_validation :normalize_email

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :provider, inclusion: { in: PROVIDERS }
  validates :password, length: { minimum: 8 }, if: -> { password.present? }
  validate :password_required_for_email_provider, on: :create

  def as_public_json
    {
      id: id,
      email: email,
      name: name,
      provider: provider,
      is_admin: admin?
    }
  end

  def self.admin_emails
    ENV.fetch("ADMIN_EMAILS", "")
      .split(",")
      .map { |email| email.strip.downcase }
      .reject(&:blank?)
  end

  def admin?
    self.class.admin_emails.include?(email.to_s.downcase)
  end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase
  end

  def password_required_for_email_provider
    return unless provider == "email"
    return if password_digest.present?

    errors.add(:password, "can't be blank")
  end
end
