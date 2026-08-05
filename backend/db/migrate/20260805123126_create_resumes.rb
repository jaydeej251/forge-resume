class CreateResumes < ActiveRecord::Migration[8.1]
  def change
    create_table :resumes do |t|
      t.string :session_id, null: false
      t.jsonb :data, null: false, default: {}

      t.timestamps
    end
    add_index :resumes, :session_id, unique: true
  end
end
