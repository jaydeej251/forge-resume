# Forge Resume

AI-assisted resume builder with a live document canvas. Chat to draft, edit on the page, download a PDF that matches what you see.

## Product

| Route | Purpose |
|-------|---------|
| `/` | Marketing landing |
| `/templates` | Template gallery (8 layouts) |
| `/builder` | Split-screen coach + live A4 canvas |

**Flow:** pick a template → guided chat (basics → summary → skills → experience → education) → polish in chat or on the canvas → download PDF. Sessions persist in the browser via `localStorage` (`session_id`); sign in to claim drafts across devices.

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
| `FRONTEND_ORIGINS` | Comma-separated CORS origins (dev defaults to localhost:3000) |

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

## Deploy (free soft launch)

Recommended free stack:

| Piece | Host | Cost notes |
|-------|------|------------|
| Frontend | [Vercel](https://vercel.com) Hobby | Free for personal projects |
| API + Postgres | [Render](https://render.com) Free | Web sleeps after ~15m idle; free DB ~30 days then upgrade/export |

Netlify also works for the frontend, but Vercel is the smoothest path for Next.js.

### A. Prepare secrets locally

1. Open `backend/config/master.key` (gitignored) and copy its contents — you will paste this as `RAILS_MASTER_KEY` on Render.
2. Have your OpenRouter API key ready.
3. Commit and push deploy config (`render.yaml`, production CORS/`DATABASE_URL` support) to GitHub.

### B. Deploy the Rails API on Render

1. Sign up at [render.com](https://render.com) with GitHub and grant access to `forge-resume`.
2. **Dashboard → New → Blueprint** → select the repo → apply `render.yaml`.
3. When prompted, set:

| Env var | Value |
|---------|--------|
| `RAILS_MASTER_KEY` | Contents of `backend/config/master.key` |
| `OPENROUTER_API_KEY` | Your OpenRouter key |
| `FRONTEND_ORIGINS` | Leave as a placeholder for now (e.g. `http://localhost:3000`) — update after Vercel gives you a URL |
| `GOOGLE_CLIENT_ID` | Google OAuth Web client ID (for Sign in with Google) |
| `ADMIN_EMAILS` | Comma-separated admin emails for `/admin` |

4. Wait for the first deploy. Note the service URL, e.g. `https://forge-resume-api.onrender.com`.
5. Sanity check: open `https://YOUR-API.onrender.com/up` — you should see a green Rails health response.

**Manual alternative (no Blueprint):** create a Free Postgres + Free Ruby Web Service with:

- Root directory: `backend`
- Build: `./bin/render-build.sh`
- Start: `bundle exec puma -C config/puma.rb`
- Health check path: `/up`
- Same env vars as above, plus `DATABASE_URL` from the Postgres service

### C. Deploy the frontend on Vercel

1. Sign up at [vercel.com](https://vercel.com) with GitHub.
2. **Add New Project** → import `forge-resume`.
3. Configure:

| Setting | Value |
|---------|--------|
| Framework | Next.js (auto) |
| Root Directory | `frontend` |
| Build Command | `npm run build` (default) |
| Output | default |

4. Environment variable:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-API.onrender.com` (no trailing slash) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Web client ID (optional) |

5. Deploy. Copy the Vercel URL, e.g. `https://forge-resume.vercel.app`.

### D. Connect CORS (required)

Back on Render → your web service → Environment:

```
FRONTEND_ORIGINS=https://forge-resume.vercel.app,https://forge-resume-git-main-USERNAME.vercel.app
```

Add any preview URLs you care about (comma-separated, no spaces or with spaces trimmed). Redeploy the API (or restart) so CORS picks up the change.

Smoke test:

1. Open the Vercel URL.
2. **Build my resume** → pick a template → chat once.
3. First API hit after idle may take 30–60s (Render cold start).

### Free-tier caveats

- **Cold starts** — Free Render sleeps; wake-up delays the first request.
- **Free Postgres TTL** — expires ~30 days; export or upgrade before then.
- **Photos** — stored on ephemeral disk; may vanish after redeploy. Move Active Storage to S3/R2 when you need durable files.
- **OpenRouter** — LLM usage is billed by OpenRouter (separate from hosting); stay on a cheap model for demos.

---

## API (v1)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/signup` | Email/password signup (+ optional guest claim) |
| `POST` | `/api/v1/auth/login` | Email/password login (+ optional guest claim) |
| `POST` | `/api/v1/auth/google` | Google ID token login/signup (+ optional claim) |
| `GET` | `/api/v1/auth/me` | Current user (Bearer JWT) |
| `POST` | `/api/v1/auth/claim` | Attach guest `session_id` to current user |
| `GET` | `/api/v1/resumes` | List current user’s resumes (auth required) |
| `POST` | `/api/v1/resumes` | Create session (optional `template`; associates user if JWT present) |
| `GET` | `/api/v1/resumes/:session_id` | Fetch session |
| `PATCH` | `/api/v1/resumes/:session_id` | Update resume data / template |
| `POST` | `/api/v1/resumes/:session_id/messages/stream` | Chat turn (SSE) |
| `POST` | `/api/v1/resumes/:session_id/messages` | Non-streaming fallback |
| `POST` | `/api/v1/resumes/:session_id/photo` | Upload photo |
| `DELETE` | `/api/v1/resumes/:session_id/photo` | Remove photo |
| `GET` | `/api/v1/admin/stats` | Admin KPIs (auth + ADMIN_EMAILS) |
| `GET` | `/api/v1/admin/users` | Admin users list with resume counts |
| `GET` | `/api/v1/admin/users/:id/resumes` | Admin: resumes for one user |
| `GET` | `/up` | Health check |

### Auth notes

- Guests can still build without an account (`session_id` in `localStorage`).
- After signup/login/Google, the current browser draft is **claimed** onto the account when possible.
- Owned resumes require a Bearer JWT matching `resume.user_id`.
- Frontend pages: `/login`, `/signup`, `/dashboard`, `/admin` (read-only; requires `ADMIN_EMAILS`).

Env for Google (optional but recommended):

| Variable | Where |
|----------|--------|
| `GOOGLE_CLIENT_ID` | Render / `backend/.env` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Vercel / `frontend/.env.local` (same Web client ID) |

Create an OAuth **Web application** client in Google Cloud Console. Authorized JavaScript origins should include `http://localhost:3000` and your Vercel URL.

Admin access (read-only):

| Variable | Where |
|----------|--------|
| `ADMIN_EMAILS` | Render / `backend/.env` — comma-separated emails that may open `/admin` |

`/auth/me` returns `is_admin` based on that list (no DB role column).

## Templates

`classic`, `modern`, `compact`, `executive`, `creative`, `two_column`, `minimal`, `timeline`

Photo slots are enabled only on templates that support them (see frontend `templateSupportsPhoto`).

---

## Roadmap

- [x] Builder shell, canvas, PDF, SSE chat, step machine  
- [x] Multi-template gallery + photo + landing / first-run tip  
- [x] Free deploy path (Vercel + Render Blueprint)  
- [x] User accounts (email/password + Google), claim guest drafts, dashboard  
- [x] Read-only admin panel (`ADMIN_EMAILS`)  
- [ ] Reliability (errors, retry, confirm New)  
- [ ] Durable photo storage (S3/R2) and paid always-on API if needed  
- [ ] Password reset / email verification  

---

## License

Private / unpublished unless otherwise noted. All rights reserved by the project author.
