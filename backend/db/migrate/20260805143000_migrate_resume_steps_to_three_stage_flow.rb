class MigrateResumeStepsToThreeStageFlow < ActiveRecord::Migration[8.1]
  def up
    change_column_default :resumes, :current_step, from: "personal_info", to: "basics"

    execute <<~SQL.squish
      UPDATE resumes
      SET current_step = CASE current_step
        WHEN 'personal_info' THEN 'basics'
        WHEN 'summary' THEN 'basics'
        WHEN 'skills' THEN 'basics'
        WHEN 'work_experience' THEN 'experience'
        ELSE current_step
      END
    SQL
  end

  def down
    change_column_default :resumes, :current_step, from: "basics", to: "personal_info"

    execute <<~SQL.squish
      UPDATE resumes
      SET current_step = CASE current_step
        WHEN 'basics' THEN 'personal_info'
        WHEN 'experience' THEN 'work_experience'
        ELSE current_step
      END
    SQL
  end
end
