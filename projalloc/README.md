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

**Important:** The app lives in the `projalloc/` folder. Production must deploy a branch that contains this directory (e.g. `dev` after merge, not an empty `main`).

1. Push the repo to GitHub and merge `dev` into `main` (or set Vercel **Production Branch** to `dev` temporarily).
2. Import the project in [Vercel](https://vercel.com).
3. **Project Settings → General → Root Directory:** set to `projalloc` (required).
4. **Framework Preset:** Vite (auto-detected when root is `projalloc`).
5. **Build Command:** `npm run build` · **Output Directory:** `dist` (defaults are fine).
6. Add environment variables (client-exposed `VITE_` prefix only):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Redeploy after saving settings.
8. In Supabase → Authentication → URL Configuration:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** add `https://your-app.vercel.app/**` and keep `http://localhost:5173/**`

`vercel.json` in this folder enables React Router SPA fallback so routes like `/admin` work on refresh.

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

## Security

### Database (RLS)

All tables use **Row Level Security**. Access is denied by default; policies grant the minimum required permissions:

- **projects / teams / spin_events / spin_logs:** public read where appropriate; writes admin-only via RLS
- **votes:** leaders may insert/delete only their own team’s vote while a project is in `voting` status
- **profiles:** users read their own row; only admins may update profiles; inserts only via the `handle_new_user` trigger
- **admin_emails:** no frontend access — used only by `SECURITY DEFINER` triggers/functions
- **spin_logs:** append-only (insert + select; no update or delete policies)

Apply migration `20250614000006_security_hardening.sql` (via `supabase db push` or SQL Editor) for the latest policies, grants, and indexes.

### Role assignment

Roles are **never set from the frontend**. On first Google sign-in, the `handle_new_user` trigger assigns:

- `admin` if the email exists in `admin_emails`
- `leader` if the email exists in `teams.leader_email`
- `viewer` otherwise (no elevated access)

Admin routes re-fetch the profile from Supabase on each navigation — client-side state alone is not trusted.

### Environment variables

Only these are exposed to the browser (Vite `VITE_` prefix):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The **service_role** key must never appear in frontend code or Vercel env vars for this project.

### What the anon key can do

The anon key identifies the public Supabase client. It can only perform operations **allowed by RLS** for the `anon` or `authenticated` roles. It cannot bypass RLS or access `admin_emails`.

### Auth rate limiting

Supabase Auth applies built-in rate limiting on OAuth and password flows. No additional client configuration is required.

### HTTP headers

Production deployments on Vercel send security headers (CSP, `X-Frame-Options`, etc.) via `vercel.json`.

### Reporting vulnerabilities

Report security issues to **thesarupraneeth@gmail.com**. Do not open public GitHub issues for undisclosed vulnerabilities.

### Further reading

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Auth security](https://supabase.com/docs/guides/auth)

## Known Security Notes

Run `npm audit` periodically (`npm run audit`). As of the last audit, no HIGH or CRITICAL vulnerabilities were reported in production dependencies.
