-- ForAllCode admin portal support tables and indexes.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  repo_id UUID REFERENCES repositories(id),
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON profiles;

CREATE TRIGGER profiles_updated_at_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

UPDATE profiles
SET updated_at = COALESCE(updated_at, created_at, NOW());

CREATE TABLE IF NOT EXISTS system_status (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  error_message TEXT,
  error_stack TEXT,
  page_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_settings (
  id INT PRIMARY KEY DEFAULT 1,
  is_live BOOLEAN DEFAULT false,
  author_revenue_pct INT DEFAULT 70,
  min_price_gbp NUMERIC DEFAULT 5.00,
  max_price_gbp NUMERIC DEFAULT 99.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO marketplace_settings DEFAULT VALUES ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS lessons (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  track INT,
  tag TEXT,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx ON profiles(updated_at);
CREATE INDEX IF NOT EXISTS learn_progress_lesson_slug_idx ON learn_progress(lesson_slug);
CREATE INDEX IF NOT EXISTS usage_events_type_idx ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);
CREATE INDEX IF NOT EXISTS error_log_created_at_idx ON error_log(created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admin can manage profiles'
  ) THEN
    CREATE POLICY "Admin can manage profiles"
      ON profiles
      FOR ALL
      TO authenticated
      USING (auth.uid() = '906e01d3-a655-4299-9269-437900cda4df'::uuid)
      WITH CHECK (auth.uid() = '906e01d3-a655-4299-9269-437900cda4df'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'repositories'
      AND policyname = 'Admin can manage repositories'
  ) THEN
    CREATE POLICY "Admin can manage repositories"
      ON repositories
      FOR ALL
      TO authenticated
      USING (auth.uid() = '906e01d3-a655-4299-9269-437900cda4df'::uuid)
      WITH CHECK (auth.uid() = '906e01d3-a655-4299-9269-437900cda4df'::uuid);
  END IF;
END $$;

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lessons'
      AND policyname = 'Lessons are readable'
  ) THEN
    CREATE POLICY "Lessons are readable"
      ON lessons
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lessons'
      AND policyname = 'Admin can manage lessons'
  ) THEN
    CREATE POLICY "Admin can manage lessons"
      ON lessons
      FOR ALL
      TO authenticated
      USING (auth.uid() = '906e01d3-a655-4299-9269-437900cda4df'::uuid)
      WITH CHECK (auth.uid() = '906e01d3-a655-4299-9269-437900cda4df'::uuid);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'error_log'
      AND policyname = 'Users can insert frontend errors'
  ) THEN
    CREATE POLICY "Users can insert frontend errors"
      ON error_log
      FOR INSERT
      TO authenticated, anon
      WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
