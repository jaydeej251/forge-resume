class CreateResumeMessagesAndLlmStatus < ActiveRecord::Migration[8.1]
  def change
    add_column :resumes, :llm_status, :string, null: false, default: "idle"
    add_column :resumes, :llm_error, :text

    create_table :resume_messages do |t|
      t.references :resume, null: false, foreign_key: true
      t.string :role, null: false
      t.text :content, null: false, default: ""
      t.string :status, null: false, default: "completed"

      t.timestamps
    end

    add_index :resume_messages, [ :resume_id, :created_at ]
  end
end
