# frozen_string_literal: true

class AddTemplateToResumes < ActiveRecord::Migration[8.1]
  def change
    add_column :resumes, :template, :string, null: false, default: "classic"
    add_index :resumes, :template
  end
end
