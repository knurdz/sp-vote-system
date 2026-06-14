# ProjAlloc — Full Stack Cursor Prompt

## Project Overview

Build **ProjAlloc** — a full-stack web platform for AI Batch 24 at the Faculty of Information Technology, University of Moratuwa. The platform manages the transparent allocation of industry software projects to student teams through a structured three-phase process: project listing → team voting → live spin-the-bottle event.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth with Google OAuth 2.0 |
| Hosting | Vercel (frontend), Supabase cloud (backend) |
| Language | TypeScript throughout |
| Routing | React Router v6 |
| State | Zustand for global auth/user state |
| Data fetching | Supabase JS client (v2) with polling (no realtime subscriptions — see note below) |

---

## Monorepo Structure

```
projalloc/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI primitives (Button, Badge, Card, Modal, Countdown)
│   │   ├── layout/          # Navbar, Sidebar, PageWrapper
│   │   ├── projects/        # ProjectCard, ProjectList, ProjectForm
│   │   ├── voting/          # VoteButton, VoterList
│   │   └── spin/            # SpinWheel, SpinResult
│   ├── pages/
│   │   ├── Home.tsx         # Public project board
│   │   ├── ProjectDetail.tsx
│   │   ├── Results.tsx
│   │   ├── Login.tsx
│   │   ├── AccessDenied.tsx
│   │   └── admin/
│   │       ├── Dashboard.tsx
│   │       ├── Projects.tsx
│   │       ├── Teams.tsx
│   │       └── Spin.tsx
│   ├── hooks/               # useAuth, useProjects, useVote, useSpinEvent
│   ├── store/               # Zustand auth store
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client init
│   │   └── utils.ts         # Shared helpers
│   ├── types/               # TypeScript interfaces for all DB tables
│   └── App.tsx              # Router setup + protected route wrappers
├── supabase/
│   └── migrations/          # SQL migration files
├── .env.example
├── package.json
└── vite.config.ts
```

---

## Database Schema

Create the following tables in Supabase. Write SQL migration files in `supabase/migrations/`.

```sql
-- Profiles (auto-created on first login via trigger)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'leader', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leader_email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  team_size INT NOT NULL,
  voting_deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'voting', 'closed', 'assigned')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id),
  leader_email TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, team_id)
);

-- Spin Events
CREATE TABLE spin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id),
  zoom_link TEXT,
  scheduled_at TIMESTAMPTZ,
  spun_at TIMESTAMPTZ,
  winning_team_id UUID REFERENCES teams(id),
  triggered_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spin Logs (immutable audit trail)
CREATE TABLE spin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spin_event_id UUID NOT NULL REFERENCES spin_events(id),
  all_candidates JSONB NOT NULL,
  winning_team_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  company TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Supabase Triggers

```sql
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN EXISTS (SELECT 1 FROM teams WHERE leader_email = NEW.email) THEN 'leader'
      ELSE 'viewer'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update project status based on voting deadline
CREATE OR REPLACE FUNCTION update_project_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.voting_deadline < NOW() AND NEW.status = 'voting' THEN
    NEW.status := 'closed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Row Level Security Policies

```sql
-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Projects (public read, admin write)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Admins can insert projects" ON projects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update projects" ON projects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete projects" ON projects FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Teams (admin write, public read)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Admins can manage teams" ON teams FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Votes (leaders vote, public read after close)
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view votes on closed projects" ON votes FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status IN ('closed', 'assigned'))
);
CREATE POLICY "Leaders can view own votes" ON votes FOR SELECT USING (
  leader_email = auth.jwt() ->> 'email'
);
CREATE POLICY "Leaders can insert votes" ON votes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'leader')
  AND leader_email = auth.jwt() ->> 'email'
  AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status = 'voting')
);
CREATE POLICY "Leaders can delete own votes" ON votes FOR DELETE USING (
  leader_email = auth.jwt() ->> 'email'
  AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status = 'voting')
);

-- Spin Events
ALTER TABLE spin_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view spin events" ON spin_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage spin events" ON spin_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Spin Logs (public read, admin insert only, NO delete/update)
ALTER TABLE spin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view spin logs" ON spin_logs FOR SELECT USING (true);
CREATE POLICY "Admins can insert spin logs" ON spin_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

---

## Authentication Flow

- Google OAuth only via Supabase Auth — no email/password
- On first login, the trigger checks if the user's email exists in the `teams` table (as `leader_email`) or in a hardcoded admin email list stored in a Supabase environment variable `ADMIN_EMAILS` (comma-separated)
- Role assignment logic:
  1. If email is in `ADMIN_EMAILS` → role = `admin`
  2. If email matches any `teams.leader_email` → role = `leader`
  3. Otherwise → role = `viewer` → redirect to `/access-denied`
- Admin emails should also be updatable via a Supabase Edge Function for security

### useAuth hook

```typescript
// src/hooks/useAuth.ts
// Returns: { user, profile, role, loading, signInWithGoogle, signOut }
// Subscribes to Supabase auth state changes
// Fetches profile from `profiles` table after login
// Stores in Zustand store
```

---

## Pages & Components

### Public Pages

#### `/` — Home (Project Board)
- Grid of ProjectCards (2 cols desktop, 1 col mobile)
- Each card shows: company logo placeholder, project title, company name, tech stack badges, team size, voting status badge, countdown timer if voting is open
- Filter bar at top: All / Voting Open / Upcoming / Closed / Assigned
- Navbar with ProjAlloc logo, nav links (Projects, Results), Login button if not logged in, user avatar + role badge if logged in

#### `/project/:id` — Project Detail
- Full project description
- Tech stack tags
- Team size required
- Voting deadline with countdown
- **If voting is open + user is a team leader:** Show a prominent "Vote for this Project" button. If already voted, show "Withdraw Vote" instead
- **After voting closes:** Show a public list of all teams that voted (team name only, not email)
- If a spin event is scheduled: show the Zoom link, scheduled time, and a countdown to the event
- If a spin result exists: show the winning team with a trophy icon

#### `/results` — Results Archive
- List of all completed spin events
- Each entry: project title, company, winning team, date, all candidate teams that were on the wheel

#### `/login` — Login
- Centered card with ProjAlloc logo
- "Sign in with Google" button using Supabase OAuth
- Brief description of what the platform is

#### `/access-denied` — Access Denied
- Shown when a Google account logs in that is neither an admin nor a registered team leader
- Message explaining they are not registered, who to contact

---

### Admin Pages (all under `/admin`, protected — redirect to `/login` if not admin)

#### `/admin` — Dashboard
- Summary cards: total projects, open votes, upcoming spin events, assigned projects
- Quick links to manage projects and teams

#### `/admin/projects` — Manage Projects
- Table of all projects with status badges
- "Add Project" button → opens a modal/slide-over form with fields:
  - Title (text)
  - Company (text)
  - Description (textarea)
  - Tech Stack (tag input — type and press enter to add)
  - Team Size (number)
  - Voting Deadline (datetime-local picker)
  - Status (dropdown: upcoming / voting / closed / assigned)
- Edit and Delete actions per row
- Delete is blocked if votes exist for that project (show warning)
- Status can be manually changed by admin at any time (e.g. to open voting early or close it)

#### `/admin/teams` — Manage Teams
- Table: Team Name | Leader Email | Registered Date | Actions
- "Add Team" button → modal with Team Name + Leader Gmail fields
- Edit leader email, delete team
- Warning if team has active votes before deleting

#### `/admin/spin/:projectId` — Spin Page
This page is designed to be **screenshared on Zoom**. It should be visually dramatic and clear at low resolution.

Layout:
- Large project title and company name at the top
- The spin wheel centered on the page, large (min 500px diameter)
- Candidate team names on wheel segments, each segment a different color
- A prominent "SPIN" button below the wheel — only clickable if no result has been logged yet
- After spin: result announcement overlay with winning team name, confetti animation, and "Lock Result" confirmation
- Once result is locked → button is permanently disabled, result is displayed

Spin wheel logic:
- Segments equally sized regardless of number of teams (pure random)
- Minimum spin duration: 4 seconds with easing (fast start, slow end)
- The wheel lands on a team determined by `Math.random()` — result is decided before animation starts, animation just reveals it
- After animation completes → show result confirmation modal
- Admin clicks "Confirm & Lock" → writes to `spin_logs` → updates `spin_events.spun_at` and `winning_team_id` → updates `projects.status` to `assigned`

Also on this page (above the wheel):
- Scheduled Zoom link (if set) with copy button
- List of all teams on the wheel
- "Schedule Event" form if not yet scheduled (datetime + Zoom link fields)

---

## TypeScript Types

```typescript
// src/types/index.ts

export type Role = 'admin' | 'leader' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  leader_email: string;
  created_at: string;
}

export type ProjectStatus = 'upcoming' | 'voting' | 'closed' | 'assigned';

export interface Project {
  id: string;
  title: string;
  company: string;
  description: string;
  tech_stack: string[];
  team_size: number;
  voting_deadline: string;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
}

export interface Vote {
  id: string;
  project_id: string;
  team_id: string;
  leader_email: string;
  voted_at: string;
}

export interface SpinEvent {
  id: string;
  project_id: string;
  zoom_link: string | null;
  scheduled_at: string | null;
  spun_at: string | null;
  winning_team_id: string | null;
  triggered_by: string | null;
  created_at: string;
}

export interface SpinLog {
  id: string;
  spin_event_id: string;
  all_candidates: { team_id: string; team_name: string }[];
  winning_team_name: string;
  project_title: string;
  company: string;
  timestamp: string;
}
```

---

## UI Design

**Visual identity:** Dark-mode first. Deep navy background (`#0D1117`), slightly lighter surface cards (`#161B22`), electric indigo as primary accent (`#6E56CF`), soft indigo for hover states (`#9E8CFC`), muted gray for secondary text (`#8B949E`), white for primary text. Status badge colors: green for voting open, yellow for upcoming, gray for closed, indigo for assigned.

**Typography:** `Inter` for all UI text (import from Google Fonts). Monospace (`JetBrains Mono`) for project IDs, tech stack tags, and timestamps only.

**Component style rules:**
- Cards: `bg-[#161B22]` with `border border-[#30363D]` and `rounded-xl`
- Buttons: primary = indigo fill, secondary = ghost with indigo border
- Badges: small, pill-shaped, colored by status
- No shadows — use border and background contrast instead
- Consistent 8px spacing grid throughout

**Navbar:**
- Left: `ProjAlloc` wordmark in Inter bold, indigo accent on the "P"
- Right: nav links + auth state (Login button or user avatar with role badge)
- Sticky, `bg-[#0D1117]/90` with backdrop blur and a bottom border

**Spin wheel visual:**
- Canvas-based or SVG-based wheel
- Segments: cycle through 6–8 distinct colors (not just indigo — use a full palette for visibility)
- Team names rendered inside segments, white text, truncated if too long
- Center pin/arrow pointing down to indicate the landing segment
- Outer ring with tick marks for added visual drama

---

## Protected Route Setup

```typescript
// src/components/layout/ProtectedRoute.tsx
// Props: role required ('admin' | 'leader')
// If not logged in → redirect to /login
// If logged in but wrong role → redirect to /access-denied
// Show loading spinner while auth is resolving
```

---

## Environment Variables

```env
# .env.example
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Admin emails are stored in Supabase as a database table `admin_emails` (not in `.env`) so they can be managed without redeployment:

```sql
CREATE TABLE admin_emails (
  email TEXT PRIMARY KEY
);
-- Seed with initial admin emails
INSERT INTO admin_emails (email) VALUES ('your@gmail.com');
```

---

## Key Business Logic Rules

1. **One vote per team per project** — enforced at DB level via UNIQUE constraint and at UI level by disabling the vote button after voting
2. **No re-spin** — once `spin_logs` has an entry for a `spin_event_id`, the Spin button is permanently disabled. This is checked both client-side and enforced via RLS (no UPDATE/DELETE on spin_logs)
3. **Voting auto-closes** — a Supabase cron job (pg_cron) or client-side check updates `projects.status` from `voting` to `closed` when `voting_deadline` passes
4. **Voter list visibility** — votes are only publicly visible after `projects.status` is `closed` or `assigned`, enforced via RLS
5. **Spin page is admin-only** — `/admin/spin/:projectId` redirects non-admins immediately

---

## Suggested Build Order

Build in this sequence to avoid blockers:

1. Supabase project setup — create tables, RLS policies, triggers, seed admin emails
2. Supabase client init + Google OAuth configuration
3. Auth flow — Login page, useAuth hook, Zustand store, profile fetch on login
4. Protected route wrapper
5. Navbar + layout shell
6. Public project board (Home page) — read-only first
7. Project detail page — read-only first
8. Voting logic — VoteButton component, useVote hook
9. Admin: Teams page (register leaders)
10. Admin: Projects page (CRUD)
11. Admin: Spin page — wheel component, scheduling, trigger + lock
12. Results page
13. Access Denied page
14. Polish — loading states, error states, empty states, countdown timers, polling-based vote count refresh

---

## Notes for Cursor

- Use `supabase-js` v2 client only — no REST calls directly
- **Do not use Supabase Realtime subscriptions anywhere.** The batch has ~450 students and the free plan caps at 200 concurrent realtime connections. Use polling instead for all live data updates:

```typescript
// Standard polling pattern — use this everywhere instead of .subscribe()
useEffect(() => {
  fetchData(); // fetch immediately on mount
  const interval = setInterval(fetchData, 15000); // then every 15 seconds
  return () => clearInterval(interval); // cleanup on unmount
}, []);
```

  Apply this pattern in: vote counts on ProjectDetail, project status on Home, spin event status on the spin page. 15 second intervals are sufficient — users will not notice the difference vs realtime for this use case.
- All Supabase queries should handle errors explicitly and surface them in the UI
- Use TypeScript strict mode (`"strict": true` in tsconfig)
- Keep Supabase queries in custom hooks (`src/hooks/`) — never inline in components
- The spin wheel must work well at 1080p when screenshared on Zoom — keep text large and contrasted
- Do not implement email notifications — this is explicitly out of scope
- Do not implement mobile layout — desktop (min 1024px) only for v1
- Add `README.md` with setup instructions: Supabase project creation, Google OAuth setup in Supabase dashboard, environment variable configuration, and Vercel deployment steps
