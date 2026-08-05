# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

allowed = ENV.fetch("FRONTEND_ORIGINS", "")
  .split(",")
  .map { |origin| origin.strip.chomp("/") }
  .reject(&:blank?)

# Empty FRONTEND_ORIGINS (common on first Render setup) would produce origins()
# with no hosts and silently block every browser request.
if allowed.empty?
  allowed = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ]
end

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed)

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      expose: [ "Content-Type" ],
      max_age: 600
  end
end
