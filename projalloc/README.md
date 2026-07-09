# ProjAlloc — Industry Project Allocation System

> A transparent, fair, and auditable platform for allocating real-world industry software projects to student teams through structured voting and randomised spin-draw events.

Built for **AI Batch 24** at the **Faculty of Information Technology, University of Moratuwa**, as part of the Semester Project (SP) module where companies sponsor real software projects and university teams compete to win them.

---

## Why This Exists

Every semester, the FIT department coordinates industry-sponsored projects where student teams apply to work on a real company's software problem. The allocation process historically involved spreadsheets, email threads, and manual matching — which was opaque, slow, and prone to disputes.

**ProjAlloc** replaces that with a structured digital workflow:

1. Admins publish available projects (with descriptions, tech stacks, deadlines)
2. Team leaders browse and vote for the project they want most
3. After voting closes, admins run a **live spin-draw event** on a Zoom call — all teams that voted for a project become candidates, and one is picked at random
4. The result is locked to the database atomically and shown to everyone in the Results Archive

This ensures:
- Every team sees exactly the same information
- Votes are timestamped and immutable
- The winner selection is unpredictable and server-side (not gameable from the frontend)
- An immutable audit log records the full list of candidates and the winner for every project

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite + TypeScript |
| **Styling** | Tailwind CSS + custom design tokens |
| **Animations** | Framer Motion |
| **Backend / Database** | Supabase (PostgreSQL 15) |
| **Auth** | Supabase Auth — Google OAuth 2.0 |
| **Database Security** | Row Level Security (RLS) on every table |
| **Hosting** | Vercel (frontend) + Supabase Cloud (backend) |
| **Real-time** | 15-second polling (no WebSocket subscriptions) |

---

## How the System Works — End to End

```
Admin                  Team Leaders               Database
  │                        │                          │
  ├─ Create project ───────────────────────────────► INSERT projects
  ├─ Set status: voting ──────────────────────────► UPDATE projects.status
  │                        │                          │
  │              Browse projects page                 │
  │              Check deadline countdown             │
  │              Cast vote ─────────────────────────► INSERT votes
  │              (or withdraw) ────────────────────► DELETE votes
  │                        │                          │
  │ [voting_deadline passes]                          │
  │ pg_cron closes project ───────────────────────► UPDATE projects.status='closed'
  │                        │                          │
  ├─ Open Spin page                                   │
  ├─ Review candidates                               SELECT votes WHERE project_id=?
  ├─ Trigger spin ────────────────────────────────► lock_spin_result() RPC
  │              Animated wheel on screen             │  ┌─ SELECT winner at random
  │              (visual only)                        │  ├─ INSERT spin_log
  │                                                   │  ├─ UPDATE spin_events
  │                                                   │  ├─ UPDATE project.status='assigned'
  │                                                   │  └─ DELETE winner's other votes
  ├─ Result visible to all ──────────────────────── SELECT spin_logs
```

---

## The Allocation Algorithm

### Voting Phase

- Each team can vote for **at most one** project (enforced at the database level via a `UNIQUE(project_id, team_id)` constraint and an RLS insert policy checking `status = 'voting'`)
- Teams may withdraw their vote and recast it any time before the voting deadline
- Votes are stored with `voted_at` timestamps for the audit log

### Spin Draw — `lock_spin_result()` (PostgreSQL Function)

The winner selection happens entirely inside a single **atomic database transaction** via a `SECURITY DEFINER` Postgres function. Here is exactly what it does:

```
1. Auth check — caller must be admin
2. Lock the project row (FOR UPDATE) to prevent race conditions
3. If still in 'voting' state and deadline passed → set status = 'closed'
4. Count all votes for this project — raise error if zero
5. Lock or create the spin_event row
6. Check the result hasn't already been recorded (idempotency guard)
7. SELECT winner:
     SELECT t.id, t.name
     FROM votes v JOIN teams t ON t.id = v.team_id
     WHERE v.project_id = ?
     ORDER BY gen_random_uuid()   ← cryptographically random ordering
     LIMIT 1
8. Verify winner is not already assigned to another project
9. Snapshot all candidates into spin_logs.all_candidates (JSONB)
10. INSERT into spin_logs (immutable audit record)
11. UPDATE spin_events with winner + timestamp
12. UPDATE project status = 'assigned'
13. DELETE winner's votes for other projects (they are now committed)
14. Return result as JSONB
```

**Key properties:**

| Property | How it's guaranteed |
|---|---|
| **Randomness** | `ORDER BY gen_random_uuid()` — Postgres-native UUID4 CSPRNG, unpredictable from outside |
| **Atomicity** | All 14 steps are in one SQL transaction — either all succeed or all roll back |
| **Idempotency** | If called twice, raises `Result already recorded` — no double-wins |
| **No frontend manipulation** | Winner is picked in the database, not in JavaScript |
| **Race-condition safe** | `FOR UPDATE` lock on both project and spin_event rows |
| **Audit trail** | `spin_logs` has no UPDATE/DELETE policies — the record is permanent |

### Auto-close via pg_cron

A `pg_cron` job runs every minute and sets `status = 'closed'` for any project whose `voting_deadline < NOW()` and `status = 'voting'`. This means projects close on time even if no admin is online.

The frontend also applies `getEffectiveStatus()` client-side — if a project's deadline has passed but the DB hasn't caught up yet, it renders the correct status immediately.

---

## User Roles

| Role | How assigned | What they can do |
|---|---|---|
| `admin` | Email in `admin_emails` table (seeded at migration) | Full admin panel: manage projects, teams, run spins |
| `leader` | Email matches `teams.leader_email` | Browse all projects, vote/withdraw, view results |
| `viewer` | Any other logged-in user | Redirected to Access Denied |
| *(anonymous)* | Not logged in | Browse projects + results (read-only) |

Roles are assigned **on first Google sign-in** by the `handle_new_user` database trigger. The frontend never sets or modifies roles — all role checks happen in RLS policies using `auth.uid()` and `auth.jwt()`.

---

## Project Structure

```
projalloc/
├── src/
│   ├── components/
│   │   ├── layout/          # PageWrapper, Sidebar, Navbar, Footer
│   │   ├── projects/        # ProjectCard, ProjectList, ProjectForm
│   │   ├── voting/          # VoteButton, vote state management
│   │   ├── spin/            # SpinWheel animation, SpinModal
│   │   ├── admin/           # Team CSV upload, admin-specific UI
│   │   └── ui/              # Design system: Button, Badge, Modal, etc.
│   ├── pages/
│   │   ├── Home.tsx          # Public project listing with filters
│   │   ├── ProjectDetail.tsx # Individual project view + vote action
│   │   ├── Results.tsx       # Spin log archive
│   │   ├── Workspace.tsx     # Leader's personal project workspace
│   │   └── admin/
│   │       ├── Dashboard.tsx # Stats + CV upload timeline settings
│   │       ├── Projects.tsx  # Project CRUD + spin trigger
│   │       ├── Teams.tsx     # Team CRUD + CSV import
│   │       └── Spin.tsx      # Live spin event page
│   ├── hooks/               # Data fetching: useProjects, useVotes, useTeams…
│   ├── store/               # Zustand auth store
│   ├── lib/                 # Supabase client, utils, validation
│   └── types/               # TypeScript interfaces
├── supabase/
│   └── migrations/          # Full schema, RLS policies, functions, cron
├── .env.example
└── vercel.json              # SPA fallback + security headers
```

---

## Database Schema

```
admin_emails        profiles           teams
────────────        ────────           ─────
email (PK)          id (PK→auth.users) id (PK)
                    email              name
                    role               leader_email
                    created_at         cv_url
                                       created_at

projects            votes              spin_events
────────            ─────              ───────────
id (PK)             id (PK)            id (PK)
title               project_id (FK)    project_id (FK, UNIQUE)
company             team_id (FK)       zoom_link
description         leader_email       scheduled_at
tech_stack[]        voted_at           spun_at
team_size           UNIQUE(project_id, winning_team_id (FK)
voting_deadline       team_id)         triggered_by (FK)
status                                 created_at
created_by (FK)
created_at          spin_logs
                    ─────────
                    id (PK)
                    spin_event_id (FK)
                    all_candidates (JSONB)
                    winning_team_name
                    project_title
                    company
                    timestamp
```

---

## Security Model

### Row Level Security (RLS)

Every table has RLS enabled. Access is **deny by default**; policies grant the minimum required:

| Table | `anon` | `leader` | `admin` |
|---|---|---|---|
| `projects` | SELECT | SELECT | ALL |
| `teams` | SELECT | SELECT | ALL |
| `votes` | SELECT (closed only, via RPC) | SELECT own + INSERT/DELETE own | SELECT ALL |
| `profiles` | — | SELECT own | SELECT ALL + UPDATE |
| `spin_events` | SELECT | SELECT | ALL |
| `spin_logs` | SELECT | SELECT | SELECT + INSERT |
| `admin_emails` | — | — | SELECT |

### Role Assignment (Server-Side Only)

```sql
-- handle_new_user trigger (runs on every Google sign-in)
CASE
  WHEN EXISTS (SELECT 1 FROM admin_emails WHERE email = NEW.email) THEN 'admin'
  WHEN EXISTS (SELECT 1 FROM teams WHERE leader_email = NEW.email)  THEN 'leader'
  ELSE 'viewer'
END
```

The frontend reads this role from the profile but **never writes it**. Admin pages re-fetch the profile from Supabase on each navigation — cached state alone is not trusted.

### Environment Variables

Only two variables are exposed to the browser (Vite `VITE_` prefix):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

The `anon` key can only perform operations **allowed by RLS**. The `service_role` key must never appear in frontend code.

---

## Setup Guide

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon key** from Settings → API

### 2. Configure Google OAuth

1. In [Google Cloud Console](https://console.cloud.google.com/), create **OAuth 2.0 credentials** (Web application)
2. Add authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. In Supabase Dashboard → Authentication → Providers → Google: enable Google, paste Client ID + Secret
4. Set Site URL to `http://localhost:5173` (add your Vercel URL for production)

### 3. Seed Your Admin Email

Before running migrations, open `supabase/migrations/20250614000000_init_schema.sql` and replace the seed values:

```sql
INSERT INTO admin_emails (email) VALUES ('your-admin@gmail.com');
```

### 4. Run Database Migrations

```bash
cd projalloc
npm install -g supabase   # or npx supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

After the initial push, enable the **pg_cron** extension in Supabase Dashboard → Database → Extensions, then push again:

```bash
supabase db push   # applies the cron migration
```

### 5. Add the Vote Count RPC (Public Vote Counts)

For anonymous users to see vote counts, run this in **Supabase SQL Editor**:

```sql
CREATE OR REPLACE FUNCTION public.get_project_vote_counts()
RETURNS TABLE (project_id uuid, vote_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT v.project_id, COUNT(*)::bigint
  FROM public.votes v
  GROUP BY v.project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_vote_counts() TO anon, authenticated;
```

### 6. Configure Environment Variables

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 7. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Admin Workflow

```
1. /admin/teams      → Add teams with leader Gmail addresses
                       (or bulk import via CSV)

2. /admin/projects   → Create projects:
                         title, company, description,
                         tech stack, team size, voting deadline
                       → Set status to "Voting Open"

3. [Leaders vote on /project/:id during the open window]

4. /admin/projects   → After voting closes, click "Spin" on a project

5. /admin/spin/:id   → Schedule a Zoom call time
                       → Screen-share the animated wheel on the call
                       → Click "Lock Result" to atomically select the winner

6. /results          → Public results archive visible to everyone
```

---

## Deployment (Vercel)

> **Important:** The app source is inside the `projalloc/` subdirectory.

1. Push the repo to GitHub
2. Import in [Vercel](https://vercel.com)
3. **Project Settings → General → Root Directory:** `projalloc`
4. **Framework Preset:** Vite (auto-detected)
5. **Build Command:** `npm run build` · **Output Directory:** `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. In Supabase → Authentication → URL Configuration:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** `https://your-app.vercel.app/**` and `http://localhost:5173/**`

`vercel.json` configures SPA fallback routing and production security headers (CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS).

---

## Key Design Decisions

### Why polling instead of Realtime subscriptions?

Supabase Realtime adds WebSocket connection overhead and is billed by concurrent connections. For a batch of ~30 teams voting over a few days, 15-second polling provides near-live updates with far less infrastructure complexity and zero additional cost.

### Why is the spin done server-side?

If the winner were selected in JavaScript, anyone with browser DevTools could inspect or replay the random seed. By running `ORDER BY gen_random_uuid()` inside a `SECURITY DEFINER` Postgres function, the randomness happens entirely server-side — the frontend only receives the already-decided result.

### Why `UNIQUE(project_id, team_id)` on votes?

A database-level unique constraint is the only truly reliable way to prevent double-voting. Application-level checks can fail under concurrent requests; the constraint cannot.

### Why is `spin_logs` append-only?

There are no `UPDATE` or `DELETE` RLS policies on `spin_logs`. Once a spin result is recorded, it cannot be modified or erased — even by an admin via the API. This gives teams confidence that the result cannot be quietly changed after the fact.

---

## Known Limitations / Future Improvements

- Teams can vote for only one project per spin cycle (by design — prevents strategic hedging)
- No email notifications when projects open or results are published
- The animated spin wheel is visual-only; it does not reflect the actual selection order
- Admin bulk-import via CSV is supported for teams; project bulk-import is not yet built

---

## Security Contact

Report vulnerabilities to **thesarupraneeth@gmail.com**. Do not open public GitHub issues for undisclosed security concerns.

Run `npm audit` periodically to check for dependency vulnerabilities.

---

## Further Reading

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Auth with Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [PostgreSQL `gen_random_uuid()`](https://www.postgresql.org/docs/current/functions-uuid.html)
- [pg_cron extension](https://github.com/citusdata/pg_cron)
