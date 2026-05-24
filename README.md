# TaskFlow 🗂️

> Team task management app — create, assign, track, and complete tasks with email notifications.

**Live URLs:**
- Frontend: `https://taskflow-your-name.vercel.app`
- Backend API: `https://taskflow-api.onrender.com`

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                    │
│              Next.js 14 + TypeScript + Tailwind         │
│                    Deployed on Vercel                   │
└────────────────────────┬────────────────────────────────┘
                         │  REST (JSON) + JWT Bearer token
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Flask/Python)                  │
│         REST API · Auth middleware · Email service      │
│                  Deployed on Render                     │
└──────────┬──────────────────────────┬───────────────────┘
           │  supabase-py (service key)│  smtplib SMTP SSL
           ▼                           ▼
┌──────────────────┐         ┌──────────────────────┐
│    Supabase       │         │   Gmail (SMTP)        │
│  PostgreSQL DB   │         │  App Password Auth   │
│  + Auth (OAuth)  │         │  Task notifications  │
│  Deployed by SB  │         └──────────────────────┘
└──────────────────┘

Auth Flow:
  1. User clicks "Continue with Google" on frontend
  2. Supabase Auth redirects to Google OAuth consent screen
  3. Google returns code → /auth/callback route
  4. Supabase exchanges code for session (JWT)
  5. Frontend stores JWT; sends as Bearer token to Flask
  6. Flask validates JWT with Supabase, extracts user.id
```

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Next.js 14, TypeScript, Tailwind  |
| Backend  | Flask 3, Python 3.11              |
| Database | Supabase (PostgreSQL)             |
| Auth     | Google OAuth 2.0 via Supabase     |
| Email    | Gmail SMTP (App Password)         |
| Deploy   | Vercel (FE) · Render (BE) · Supabase (DB) |

## Features

- ✅ Google OAuth sign-in (no passwords)
- ✅ Create tasks with title, description, priority
- ✅ Assign tasks to any registered teammate
- ✅ Update task status (todo → in progress → done)
- ✅ Delete tasks (creator only)
- ✅ Email notification on task creation (creator + assignee)
- ✅ Email notification on task completion
- ✅ Row-level security: users only see their own tasks
- ✅ Responsive dark-mode UI

---

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- A Supabase project
- A Gmail account with 2FA + App Password

### 1. Clone & install

```bash
git clone https://github.com/your-name/taskflow.git
cd taskflow
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `migrations/001_initial_schema.sql`
3. Go to **Authentication → Providers → Google**, enable it, and add your OAuth credentials
   - Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
   - Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Copy your project URL, anon key, and service role key

### 3. Backend

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, GMAIL_USER, GMAIL_APP_PASSWORD
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## Deployment

### Backend → Render

1. Push repo to GitHub
2. New Web Service on [render.com](https://render.com)
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn app:app --bind 0.0.0.0:$PORT`
6. Add all env vars from `.env.example`

### Frontend → Vercel

1. Import repo at [vercel.com](https://vercel.com)
2. Set root directory to `frontend`
3. Add env vars (`NEXT_PUBLIC_*`) in project settings
4. Deploy

### Database → Supabase (already live)

Migrations are in `/migrations`. Re-run on a fresh project with:
```
supabase db push  # if using Supabase CLI
# or paste SQL into the Supabase SQL Editor
```

---

## API Reference

All endpoints require `Authorization: Bearer <supabase-jwt>`.

| Method | Path               | Description                     |
|--------|--------------------|---------------------------------|
| GET    | /api/health        | Health check                    |
| GET    | /api/users         | List all users                  |
| GET    | /api/users/me      | Get current user profile        |
| GET    | /api/tasks         | List tasks (created or assigned)|
| POST   | /api/tasks         | Create task + send emails       |
| GET    | /api/tasks/:id     | Get single task                 |
| PUT    | /api/tasks/:id     | Update task (status/details)    |
| DELETE | /api/tasks/:id     | Delete task (creator only)      |

---

## Project Structure

```
taskflow/
├── migrations/
│   └── 001_initial_schema.sql   # Supabase DB schema
├── backend/
│   ├── app.py                   # Flask app + routes
│   ├── email_service.py         # Gmail SMTP service
│   ├── requirements.txt
│   ├── Procfile                 # For Render
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx               # Login page
    │   │   ├── layout.tsx
    │   │   ├── globals.css
    │   │   ├── auth/callback/route.ts # OAuth callback
    │   │   └── dashboard/page.tsx     # Main dashboard
    │   ├── components/
    │   │   ├── TaskCard.tsx
    │   │   └── CreateTaskModal.tsx
    │   ├── lib/
    │   │   ├── supabase.ts
    │   │   └── api.ts
    │   └── types/index.ts
    ├── package.json
    ├── tailwind.config.js
    ├── tsconfig.json
    └── .env.example
```

---

## Gmail Setup (App Password)

1. Enable 2-Step Verification on your Google account
2. Visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create app password → App: "Mail", Device: "Other (TaskFlow)"
4. Use the 16-character password as `GMAIL_APP_PASSWORD`

---

## License

MIT
