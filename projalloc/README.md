# ProjAlloc

Full-stack web platform for AI Batch 24 at the Faculty of Information Technology, University of Moratuwa. Manages transparent allocation of industry software projects to student teams through project listing, team voting, and live spin-the-bottle events.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + TypeScript
- **Backend:** Supabase (PostgreSQL + Row Level Security)
- **Auth:** Supabase Auth with Google OAuth 2.0
- **Hosting:** Vercel (frontend), Supabase cloud (backend)

## Project Structure

```
projalloc/
├── src/                  # React application
├── supabase/migrations/  # Database schema & RLS
└── .env.example          # Environment variable template
```

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon key** from Settings → API

### 2. Configure Google OAuth

1. In [Google Cloud Console](https://console.cloud.google.com/), create OAuth 2.0 credentials (Web application)
2. Add authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. In Supabase Dashboard → Authentication → Providers → Google, enable Google and paste Client ID + Secret
4. Set Site URL to `http://localhost:5173` (add your Vercel URL for production)

### 3. Run Database Migrations

```bash
cd projalloc
npm install -g supabase   # or use npx supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

Before pushing, edit `supabase/migrations/20250614000000_init_schema.sql` and replace `your@gmail.com` in the `admin_emails` seed with your admin Gmail.

After the initial migration, enable the **pg_cron** extension in Supabase Dashboard → Database → Extensions, then run:

```bash
supabase db push   # applies the cron migration
```

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set **Root Directory** to `projalloc`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Add your Vercel URL to Supabase Auth → URL Configuration → Redirect URLs

## User Roles

| Role | Access |
|---|---|
| **admin** | Full admin panel — manage projects, teams, spin events |
| **leader** | Vote on open projects (one vote per team per project) |
| **viewer** | Access denied — account not registered |

Admins are seeded via the `admin_emails` table. Team leaders are registered by admins in `/admin/teams`.

## Key Features

- Public project board with status filters and countdown timers
- Team leader voting with withdraw support during voting period
- Admin CRUD for projects and teams
- Live spin-the-bottle wheel for Zoom screenshare events
- Immutable spin result audit log
- 15-second polling for live updates (no Realtime subscriptions)

## Admin Workflow

1. Add teams with leader Gmail addresses in `/admin/teams`
2. Create projects and set status to **Voting Open** in `/admin/projects`
3. After voting closes, open `/admin/spin/:projectId` to schedule and run the spin event
4. Confirm & lock the result — project status becomes **Assigned**
5. View all results at `/results`
