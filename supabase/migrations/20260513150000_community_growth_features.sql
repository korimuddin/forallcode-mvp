-- Community and growth features: portfolio mode, discussions, feed events,
-- and developer spotlight.

CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  number INT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT DEFAULT 'general',
  is_answered BOOLEAN DEFAULT false,
  answer_comment_id UUID,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(repo_id, number)
);

CREATE TABLE IF NOT EXISTS discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_answer BOOLEAN DEFAULT false,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussion_upvotes (
  user_id UUID REFERENCES profiles(id),
  comment_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

CREATE TABLE IF NOT EXISTS portfolio_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  screenshot_url TEXT,
  live_url TEXT,
  tech_stack TEXT[],
  featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, repo_id)
);

CREATE TABLE IF NOT EXISTS feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  pr_id UUID REFERENCES pull_requests(id) ON DELETE CASCADE,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spotlight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  headline TEXT NOT NULL,
  reason TEXT NOT NULL,
  featured_repo_id UUID REFERENCES repositories(id),
  week_of DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_of)
);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS professional_title TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('portfolio-screenshots', 'portfolio-screenshots', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

CREATE INDEX IF NOT EXISTS discussions_repo_id_idx ON discussions(repo_id);
CREATE INDEX IF NOT EXISTS discussion_comments_discussion_id_idx ON discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS portfolio_entries_user_id_idx ON portfolio_entries(user_id);
CREATE INDEX IF NOT EXISTS feed_events_actor_id_idx ON feed_events(actor_id);
CREATE INDEX IF NOT EXISTS feed_events_created_at_idx ON feed_events(created_at);

CREATE OR REPLACE FUNCTION next_discussion_number(p_repo_id UUID)
RETURNS INT AS $$
  SELECT COALESCE(MAX(number), 0) + 1 FROM discussions WHERE repo_id = p_repo_id;
$$ LANGUAGE SQL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Portfolio screenshots are publicly readable'
  ) THEN
    CREATE POLICY "Portfolio screenshots are publicly readable"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'portfolio-screenshots');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users upload own portfolio screenshots'
  ) THEN
    CREATE POLICY "Users upload own portfolio screenshots"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'portfolio-screenshots'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users update own portfolio screenshots'
  ) THEN
    CREATE POLICY "Users update own portfolio screenshots"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'portfolio-screenshots'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'portfolio-screenshots'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users delete own portfolio screenshots'
  ) THEN
    CREATE POLICY "Users delete own portfolio screenshots"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'portfolio-screenshots'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
