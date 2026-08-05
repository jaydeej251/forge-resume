# frozen_string_literal: true

RubyLLM.configure do |config|
  config.openrouter_api_key = ENV["OPENROUTER_API_KEY"]
  config.default_model = ENV.fetch("OPENROUTER_MODEL", "openai/gpt-4o-mini")
end
