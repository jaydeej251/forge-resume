# frozen_string_literal: true

require "net/http"

# Verifies Google Identity Services ID tokens using Google's JWKS.
class GoogleIdTokenVerifier
  JWKS_URL = URI("https://www.googleapis.com/oauth2/v3/certs")
  ISSUERS = [
    "https://accounts.google.com",
    "accounts.google.com"
  ].freeze

  class Error < StandardError; end

  def self.verify!(id_token)
    new.verify!(id_token)
  end

  def verify!(id_token)
    raise Error, "id_token is required" if id_token.blank?
    raise Error, "GOOGLE_CLIENT_ID is not configured" if client_id.blank?

    payload, = JWT.decode(
      id_token,
      nil,
      true,
      {
        algorithms: [ "RS256" ],
        jwks: jwks,
        iss: ISSUERS,
        verify_iss: true,
        aud: client_id,
        verify_aud: true,
        verify_expiration: true
      }
    )

    payload.with_indifferent_access
  rescue JWT::DecodeError => e
    raise Error, "Invalid Google token: #{e.message}"
  end

  private

  def client_id
    ENV["GOOGLE_CLIENT_ID"].to_s.strip
  end

  def jwks
    @jwks ||= begin
      response = Net::HTTP.get_response(JWKS_URL)
      raise Error, "Failed to fetch Google JWKS" unless response.is_a?(Net::HTTPSuccess)

      JWT::JWK::Set.new(JSON.parse(response.body))
    end
  end
end
