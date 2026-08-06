class Resume < ApplicationRecord
  include ResumeStepMachine

  TEMPLATES = %w[classic modern compact executive creative two_column minimal timeline].freeze
  MAX_PHOTO_BYTES = 2.megabytes
  PHOTO_CONTENT_TYPES = %w[image/jpeg image/png image/webp].freeze

  EMPTY_STATE = {
    "personal_info" => {
      "full_name" => "",
      "email" => "",
      "phone" => "",
      "location" => "",
      "target_role" => "",
      "linkedin_url" => nil,
      "github_url" => nil
    },
    "summary" => "",
    "work_experience" => [],
    "skills" => {
      "technical" => [],
      "soft" => []
    },
    "education" => []
  }.freeze

  LLM_STATUSES = %w[idle processing failed].freeze
  MAX_MESSAGE_LENGTH = 4_000

  has_many :resume_messages, dependent: :destroy
  has_one_attached :photo
  belongs_to :user, optional: true

  before_validation :ensure_session_id, on: :create
  before_validation :ensure_data, on: :create
  before_validation :ensure_current_step
  before_validation :ensure_template
  after_create :seed_welcome_message!

  validates :session_id, presence: true, uniqueness: true
  validates :data, presence: true
  validates :llm_status, inclusion: { in: LLM_STATUSES }
  validates :template, inclusion: { in: TEMPLATES }
  validate :acceptable_photo, if: -> { photo.attached? }

  def processing?
    llm_status == "processing"
  end

  def owned?
    user_id.present?
  end

  def accessible_by?(viewer)
    return true unless owned?

    viewer.present? && viewer.id == user_id
  end

  class AlreadyOwnedError < StandardError; end

  def claim_for!(viewer)
    raise ArgumentError, "user required" if viewer.blank?

    if user_id.nil?
      update!(user: viewer)
      return self
    end
    return self if user_id == viewer.id

    raise AlreadyOwnedError, "Resume already owned by another user"
  end

  def photo_url
    return nil unless photo.attached?

    Rails.application.routes.url_helpers.rails_blob_url(
      photo,
      only_path: false,
      **url_options
    )
  end

  private

  def ensure_session_id
    self.session_id = SecureRandom.uuid if session_id.blank?
  end

  def ensure_data
    self.data = EMPTY_STATE.deep_dup if data.blank?
  end

  def ensure_template
    self.template = "classic" if template.blank?
    self.template = template.to_s.downcase
  end

  def ensure_current_step
    legacy = {
      "personal_info" => "basics",
      "work_experience" => "experience"
    }
    self.current_step = legacy[current_step] if legacy.key?(current_step)
    self.current_step = "basics" if current_step.blank? || STEPS.exclude?(current_step)
  end

  def acceptable_photo
    unless PHOTO_CONTENT_TYPES.include?(photo.blob.content_type)
      errors.add(:photo, "must be a JPEG, PNG, or WebP image")
    end

    if photo.blob.byte_size > MAX_PHOTO_BYTES
      errors.add(:photo, "must be smaller than 2MB")
    end
  end

  def url_options
    {
      host: ENV.fetch("API_HOST", "localhost"),
      port: ENV.fetch("API_PORT", "3001"),
      protocol: ENV.fetch("API_PROTOCOL", "http")
    }
  end
end
