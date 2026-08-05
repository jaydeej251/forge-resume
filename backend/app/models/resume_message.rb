class ResumeMessage < ApplicationRecord
  ROLES = %w[user assistant].freeze
  STATUSES = %w[pending completed failed].freeze

  belongs_to :resume

  validates :role, presence: true, inclusion: { in: ROLES }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :content, presence: true, unless: -> { status == "pending" }
end
