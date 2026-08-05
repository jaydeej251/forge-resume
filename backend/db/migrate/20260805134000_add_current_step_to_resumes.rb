class AddCurrentStepToResumes < ActiveRecord::Migration[8.1]
  def change
    add_column :resumes, :current_step, :string, null: false, default: "personal_info"
    add_index :resumes, :current_step
  end
end
