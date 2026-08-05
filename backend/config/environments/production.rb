require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.enable_reloading = false

  # Eager load code on boot for better performance and memory savings (ignored by Rake tasks).
  config.eager_load = true

  # Full error reports are disabled.
  config.consider_all_requests_local = false

  # Cache assets for far-future expiry since they are all digest stamped.
  config.public_file_server.headers = { "cache-control" => "public, max-age=#{1.year.to_i}" }

  # Ephemeral disk on free hosts — photos may disappear on redeploy. Use S3/R2 later for durability.
  config.active_storage.service = :local

  config.assume_ssl = true
  config.force_ssl = true
  config.ssl_options = { redirect: { exclude: ->(request) { request.path == "/up" } } }

  config.log_tags = [ :request_id ]
  config.logger   = ActiveSupport::TaggedLogging.logger(STDOUT)
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")
  config.silence_healthcheck_path = "/up"
  config.active_support.report_deprecations = false

  # Free-tier friendly: chat runs in-request over SSE, so Solid Cache/Queue multi-DB is not required.
  config.cache_store = :memory_store
  config.active_job.queue_adapter = :async

  config.action_mailer.default_url_options = { host: ENV.fetch("APP_HOST", "example.com") }

  config.i18n.fallbacks = true
  config.active_record.dump_schema_after_migration = false
  config.active_record.attributes_for_inspect = [ :id ]

  # Allow Render hostname(s) and optional custom APP_HOST.
  config.hosts.clear
  config.hosts << ENV["APP_HOST"] if ENV["APP_HOST"].present?
  config.hosts << ENV["RENDER_EXTERNAL_HOSTNAME"] if ENV["RENDER_EXTERNAL_HOSTNAME"].present?
  config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
end
