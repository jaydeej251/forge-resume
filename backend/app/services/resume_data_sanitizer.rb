# frozen_string_literal: true

# Guards against malformed LLM / client payloads that can pollute jsonb resume data
# (seen as long strings of '}', '","', etc. inside bullet_points).
class ResumeDataSanitizer
  MAX_BULLET_LENGTH = 420
  MAX_SKILL_LENGTH = 80
  MAX_FIELD_LENGTH = 200
  MAX_SUMMARY_LENGTH = 2_000

  class << self
    def call(incoming, previous: {})
      incoming = deep_stringify(incoming)
      previous = deep_stringify(previous)

      {
        "personal_info" => sanitize_personal_info(
          incoming["personal_info"],
          previous["personal_info"]
        ),
        "summary" => sanitize_summary(incoming["summary"], previous["summary"]),
        "work_experience" => sanitize_work_experience(
          incoming["work_experience"],
          previous["work_experience"]
        ),
        "skills" => sanitize_skills(incoming["skills"], previous["skills"]),
        "education" => sanitize_education(incoming["education"], previous["education"])
      }
    end

    def corrupt?(value)
      text = value.to_s
      return true if text.blank?
      return true if text.match?(/\A[\s,\"'\{\}\[\]]+\z/)
      return true if text.length > MAX_BULLET_LENGTH * 2
      return true if text.count("}") > 2 || text.count("{") > 2
      return true if text.include?('","",') || text.include?("}}},") || text.include?('"}]')
      return true if text.match?(/["']\s*,\s*["']\s*,\s*["']/)
      return true if text.scan(/"/).size > 10
      false
    end

    def heavily_corrupt?(payload)
      data = deep_stringify(payload)
      Array(data["work_experience"]).any? do |role|
        Array(role.is_a?(Hash) ? role["bullet_points"] : nil).any? { |b| corrupt?(b) }
      end
    end

    private

    def deep_stringify(value)
      case value
      when Hash
        value.deep_stringify_keys.transform_values { |v| deep_stringify(v) }
      when Array
        value.map { |v| deep_stringify(v) }
      else
        value
      end
    end

    def sanitize_personal_info(incoming, previous)
      incoming = (incoming || {}).to_h
      previous = (previous || {}).to_h
      %w[full_name email phone location target_role linkedin_url github_url].index_with do |key|
        raw = incoming.key?(key) ? incoming[key] : previous[key]
        next nil if raw.nil?

        text = blankish(raw)
        next nil if text.nil?

        next previous[key] if text.present? && corrupt?(text)

        text.slice(0, MAX_FIELD_LENGTH)
      end
    end

    def sanitize_summary(incoming, previous)
      text = incoming.to_s.strip
      text = previous.to_s.strip if text.blank? || corrupt?(text)
      text.slice(0, MAX_SUMMARY_LENGTH)
    end

    def sanitize_skills(incoming, previous)
      incoming = (incoming || {}).to_h
      previous = (previous || {}).to_h

      {
        "technical" => sanitize_skill_list(incoming["technical"], previous["technical"]),
        "soft" => sanitize_skill_list(incoming["soft"], previous["soft"])
      }
    end

    def sanitize_skill_list(incoming, previous)
      list = Array(incoming).map { |s| s.to_s.strip }.reject { |s| s.blank? || corrupt?(s) || s.length > MAX_SKILL_LENGTH }
      list = Array(previous).map { |s| s.to_s.strip }.reject(&:blank?) if list.empty?
      list.first(20)
    end

    def sanitize_education(incoming, previous)
      roles = Array(incoming).filter_map { |item| sanitize_education_item(item) }
      roles = Array(previous).filter_map { |item| sanitize_education_item(item) } if roles.empty? && Array(incoming).any? && heavily_corrupt_roles?(incoming)
      roles
    end

    def sanitize_education_item(item)
      return nil unless item.is_a?(Hash)

      item = item.deep_stringify_keys
      institution = item["institution"].to_s.strip
      return nil if institution.blank? || corrupt?(institution)

      {
        "id" => item["id"].presence || SecureRandom.uuid,
        "institution" => institution.slice(0, MAX_FIELD_LENGTH),
        "degree" => clean_field(item["degree"]),
        "graduation_year" => clean_field(item["graduation_year"], max: 20)
      }
    end

    def sanitize_work_experience(incoming, previous)
      previous_roles = Array(previous).filter_map { |item| sanitize_role(item, allow_empty_bullets: true) }
      cleaned = Array(incoming).filter_map { |item| sanitize_role(item) }

      if cleaned.empty? && previous_roles.any?
        Rails.logger.warn("[ResumeDataSanitizer] Incoming work_experience unusable; keeping previous roles")
        cleaned = previous_roles
      elsif heavily_corrupt_roles?(incoming) && previous_roles.any? && cleaned.size < previous_roles.size
        Rails.logger.warn("[ResumeDataSanitizer] Incoming work_experience partially corrupt; preferring previous roles")
        cleaned = previous_roles
      end

      dedupe_roles(cleaned)
    end

    def heavily_corrupt_roles?(roles)
      Array(roles).any? do |role|
        next true unless role.is_a?(Hash)

        bullets = Array(role["bullet_points"] || role[:bullet_points])
        bullets.any? { |b| corrupt?(b) } ||
          corrupt?(role["company"] || role[:company]) ||
          corrupt?(role["position"] || role[:position])
      end
    end

    def sanitize_role(item, allow_empty_bullets: false)
      return nil unless item.is_a?(Hash)

      item = item.deep_stringify_keys
      company = item["company"].to_s.strip
      position = item["position"].to_s.strip
      return nil if company.blank? || position.blank?
      return nil if corrupt?(company) || corrupt?(position)

      bullets = normalize_bullets(item["bullet_points"])
      return nil if bullets.empty? && !allow_empty_bullets

      {
        "id" => item["id"].presence || SecureRandom.uuid,
        "company" => company.slice(0, MAX_FIELD_LENGTH),
        "position" => position.slice(0, MAX_FIELD_LENGTH),
        "start_date" => clean_field(item["start_date"], max: 40),
        "end_date" => clean_field(item["end_date"], max: 40),
        "current" => ActiveModel::Type::Boolean.new.cast(item["current"]),
        "bullet_points" => bullets
      }
    end

    def normalize_bullets(raw)
      Array(raw).flat_map { |entry|
        entry.is_a?(Array) ? entry : [ entry ]
      }.map { |b| b.to_s.strip }
        .reject { |b| b.blank? || corrupt?(b) }
        .map { |b| b.slice(0, MAX_BULLET_LENGTH) }
        .first(7)
    end

    def dedupe_roles(roles)
      seen = {}
      roles.reverse_each.filter_map do |role|
        key = [ role["company"].to_s.downcase, role["position"].to_s.downcase, role["start_date"].to_s ]
        next if seen[key]

        seen[key] = true
        role
      end.reverse
    end

    def clean_field(value, max: MAX_FIELD_LENGTH)
      text = blankish(value)
      return "" if text.blank? || corrupt?(text)

      text.slice(0, max)
    end

    # LLM structured output often emits literal "null" / "undefined" for optional fields.
    def blankish(value)
      return nil if value.nil?

      text = value.to_s.strip
      return nil if text.blank?
      return nil if text.match?(/\A(null|undefined|nil|none|n\/a)\z/i)

      text
    end
  end
end
