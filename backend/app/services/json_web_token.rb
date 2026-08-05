# frozen_string_literal: true

module JsonWebToken
  module_function

  ALGORITHM = "HS256"
  TTL = 30.days

  def encode(user)
    payload = {
      sub: user.id,
      email: user.email,
      exp: TTL.from_now.to_i,
      iat: Time.current.to_i
    }
    JWT.encode(payload, secret, ALGORITHM)
  end

  def decode(token)
    body, = JWT.decode(token.to_s, secret, true, { algorithm: ALGORITHM })
    body.with_indifferent_access
  rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::ImmatureSignature
    nil
  end

  def secret
    ENV["JWT_SECRET"].presence || Rails.application.secret_key_base
  end
end
