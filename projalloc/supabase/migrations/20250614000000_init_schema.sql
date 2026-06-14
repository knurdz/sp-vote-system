-- Admin emails (managed via Supabase dashboard in v1)
CREATE TABLE admin_emails (
  email TEXT PRIMARY KEY
);

INSERT INTO admin_emails (email) VALUES ('thesarupraneeth@gmail.com');

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

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN EXISTS (SELECT 1 FROM public.admin_emails WHERE email = NEW.email) THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM public.teams WHERE leader_email = NEW.email) THEN 'leader'
      ELSE 'viewer'
    END
  );
  RETURN NEW;
END;
$$;

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

CREATE TRIGGER before_project_update
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_project_status();

-- Row Level Security

-- Admin emails
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read admin emails" ON admin_emails FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
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
CREATE POLICY "Admins can view all votes" ON votes FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
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

-- Auto-close voting via pg_cron (enable pg_cron extension in Supabase dashboard first)
-- SELECT cron.schedule(
--   'close-expired-voting',
--   '* * * * *',
--   $$UPDATE projects SET status = 'closed' WHERE status = 'voting' AND voting_deadline < NOW()$$
-- );
