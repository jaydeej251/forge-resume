# frozen_string_literal: true

require "ruby_llm/schema"

class ResumeEnhancementSchema < RubyLLM::Schema
  description "Resume JSON update + short coach reply"

  string :assistant_message, description: "Short coach reply with next action"
  boolean :advance_step, description: "true when stage is complete or skipped"

  object :resume do
    object :personal_info do
      string :full_name
      string :email
      string :phone
      string :location
      string :target_role
      optional :linkedin_url do
        string
      end
      optional :github_url do
        string
      end
    end

    string :summary

    array :work_experience do
      object do
        string :id
        string :company
        string :position
        string :start_date
        string :end_date
        boolean :current
        array :bullet_points, of: :string
      end
    end

    object :skills do
      array :technical, of: :string
      array :soft, of: :string
    end

    array :education do
      object do
        string :id
        string :institution
        string :degree
        string :graduation_year
      end
    end
  end
end
