# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_08_06_060001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "resume_messages", force: :cascade do |t|
    t.text "content", default: "", null: false
    t.datetime "created_at", null: false
    t.bigint "resume_id", null: false
    t.string "role", null: false
    t.string "status", default: "completed", null: false
    t.datetime "updated_at", null: false
    t.index ["resume_id", "created_at"], name: "index_resume_messages_on_resume_id_and_created_at"
    t.index ["resume_id"], name: "index_resume_messages_on_resume_id"
  end

  create_table "resumes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "current_step", default: "basics", null: false
    t.jsonb "data", default: {}, null: false
    t.text "llm_error"
    t.string "llm_status", default: "idle", null: false
    t.string "session_id", null: false
    t.string "template", default: "classic", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["current_step"], name: "index_resumes_on_current_step"
    t.index ["session_id"], name: "index_resumes_on_session_id", unique: true
    t.index ["template"], name: "index_resumes_on_template"
    t.index ["user_id"], name: "index_resumes_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "google_uid"
    t.string "name", default: "", null: false
    t.string "password_digest"
    t.string "provider", default: "email", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["google_uid"], name: "index_users_on_google_uid", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "resume_messages", "resumes"
  add_foreign_key "resumes", "users"
end
