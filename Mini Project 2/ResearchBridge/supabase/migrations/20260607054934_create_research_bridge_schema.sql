
-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own" ON projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "projects_insert_own" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Stakeholders
CREATE TYPE influence_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE interest_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE stance_type AS ENUM ('supporter', 'neutral', 'blocker', 'unknown');

CREATE TABLE IF NOT EXISTS stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  organization TEXT,
  influence_level influence_level NOT NULL DEFAULT 'medium',
  interest_level interest_level NOT NULL DEFAULT 'medium',
  stance stance_type NOT NULL DEFAULT 'unknown',
  notes TEXT,
  profile_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stakeholders_select_own" ON stakeholders FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "stakeholders_insert_own" ON stakeholders FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "stakeholders_update_own" ON stakeholders FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "stakeholders_delete_own" ON stakeholders FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Interview Sessions
CREATE TYPE session_status AS ENUM ('active', 'completed');

CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stakeholder_id UUID NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  status session_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own" ON interview_sessions FOR SELECT TO authenticated
  USING (stakeholder_id IN (
    SELECT s.id FROM stakeholders s
    JOIN projects p ON s.project_id = p.id
    WHERE p.user_id = auth.uid()
  ));
CREATE POLICY "sessions_insert_own" ON interview_sessions FOR INSERT TO authenticated
  WITH CHECK (stakeholder_id IN (
    SELECT s.id FROM stakeholders s
    JOIN projects p ON s.project_id = p.id
    WHERE p.user_id = auth.uid()
  ));
CREATE POLICY "sessions_update_own" ON interview_sessions FOR UPDATE TO authenticated
  USING (stakeholder_id IN (
    SELECT s.id FROM stakeholders s
    JOIN projects p ON s.project_id = p.id
    WHERE p.user_id = auth.uid()
  ));
CREATE POLICY "sessions_delete_own" ON interview_sessions FOR DELETE TO authenticated
  USING (stakeholder_id IN (
    SELECT s.id FROM stakeholders s
    JOIN projects p ON s.project_id = p.id
    WHERE p.user_id = auth.uid()
  ));

-- Insights
CREATE TYPE insight_type AS ENUM ('summary', 'recommendation', 'risk');

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type insight_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insights_select_own" ON insights FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "insights_insert_own" ON insights FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "insights_update_own" ON insights FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "insights_delete_own" ON insights FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER stakeholders_updated_at BEFORE UPDATE ON stakeholders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON interview_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
