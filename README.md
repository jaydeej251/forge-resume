# Forge Resume

AI-assisted resume builder with a live document canvas. Chat to draft, edit on the page, download a PDF that matches what you see.

## Product

| Route | Purpose |
|-------|---------|
| `/` | Marketing landing |
| `/templates` | Template gallery (8 layouts) |
| `/builder` | Split-screen coach + live A4 canvas |

**Flow:** pick a template → guided chat (basics → experience → education) → hover-edit the canvas → download PDF. Sessions persist in the browser via `localStorage` (`session_id`); auth is planned for a later phase.

Optional profile photo on templates that support it. Template can be changed in-builder without losing content.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| PDF | `@react-pdf/renderer` (client-side export) |
| Backend | Ruby on Rails 8 (API mode), Puma |
| Database | PostgreSQL (`jsonb` resume payload + relational messages) |
| Files | Active Storage (photos) |
| LLM | [`ruby_llm`](https://github.com/crmne/ruby_llm) → [OpenRouter](https://openrouter.ai) |
| Cross-origin | `rack-cors` |

```
project-resume-builder/
├── backend/    # Rails API (default :3001)
└── frontend/   # Next.js app (default :3000)
```

---

## How it works

1. **Chat turn (SSE)** — `POST /api/v1/resumes/:session_id/messages/stream`  
   Persists user/assistant messages, runs `ResumeEnhancer` (OpenRouter structured update, or a fast path for tokens like `done` / `skip`), merges into resume `jsonb`, may advance the stage machine, then streams the coach reply as SSE tokens.

2. **Canvas edits** — Hover fields on the A4 preview; changes sync with a debounced `PATCH` (no LLM round-trip).

3. **PDF** — Generated in the browser from the same resume state + selected template so export matches the preview.

---

## Prerequisites

- Ruby 3.2+
- Node.js 20+
- PostgreSQL 14+ (project was developed against PostgreSQL 17)
- Bundler and npm

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
bundle install
bin/rails db:create db:migrate
bin/rails server -p 3001
```

Configure `backend/.env` (see `.env.example`):

| Variable | Notes |
|----------|--------|
| `DATABASE_*` | Postgres host, port, user, password |
| `OPENROUTER_API_KEY` | Required for chat enhancements |
| `OPENROUTER_MODEL` | Default `openai/gpt-4o-mini` |

Default local DB credentials in the example file: user/password `resume_builder` on `127.0.0.1:5432`.

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)  
API base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)

---

## API (v1)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/resumes` | Create session (optional `template`) |
| `GET` | `/api/v1/resumes/:session_id` | Fetch session |
| `PATCH` | `/api/v1/resumes/:session_id` | Update resume data / template |
| `POST` | `/api/v1/resumes/:session_id/messages/stream` | Chat turn (SSE) |
| `POST` | `/api/v1/resumes/:session_id/messages` | Non-streaming fallback |
| `POST` | `/api/v1/resumes/:session_id/photo` | Upload photo |
| `DELETE` | `/api/v1/resumes/:session_id/photo` | Remove photo |
| `GET` | `/up` | Health check |

---

## Templates

`classic`, `modern`, `compact`, `executive`, `creative`, `two_column`, `minimal`, `timeline`

Photo slots are enabled only on templates that support them (see frontend `templateSupportsPhoto`).

---

## Roadmap

- [x] Builder shell, canvas, PDF, SSE chat, step machine  
- [x] Multi-template gallery + photo + landing / first-run tip  
- [ ] Reliability (errors, retry, confirm New) and deploy (Vercel + Railway)  
- [ ] User accounts and multi-resume ownership (schema restructure)

---

## License

Private / unpublished unless otherwise noted. All rights reserved by the project author.
