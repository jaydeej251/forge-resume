# frozen_string_literal: true

class AddUserIdToResumes < ActiveRecord::Migration[8.1]
  def change
    add_reference :resumes, :user, foreign_key: true, null: true, index: true
  end
end
