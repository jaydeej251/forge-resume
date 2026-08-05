# frozen_string_literal: true

class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest
      t.string :name, null: false, default: ""
      t.string :google_uid
      t.string :provider, null: false, default: "email"

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :google_uid, unique: true
  end
end
