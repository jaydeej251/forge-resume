# Backend

Rails 8 API for Forge Resume. See the [root README](../README.md) for full setup and API documentation.

```bash
cp .env.example .env
bundle install
bin/rails db:create db:migrate
bin/rails server -p 3001
```

Requires PostgreSQL and an `OPENROUTER_API_KEY` for chat enhancements.
