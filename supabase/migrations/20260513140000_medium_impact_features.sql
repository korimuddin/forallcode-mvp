CREATE TABLE IF NOT EXISTS repo_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(repo_id, topic)
);

CREATE TABLE IF NOT EXISTS project_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Project board',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES project_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  colour TEXT DEFAULT '#e8e0d4',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID REFERENCES board_columns(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gist_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gist_id UUID REFERENCES gists(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  language TEXT,
  content TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gist_stars (
  user_id UUID REFERENCES profiles(id),
  gist_id UUID REFERENCES gists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, gist_id)
);

CREATE TABLE IF NOT EXISTS repo_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  stars_count INT DEFAULT 0,
  forks_count INT DEFAULT 0,
  open_issues INT DEFAULT 0,
  open_prs INT DEFAULT 0,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(repo_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS repo_topics_repo_id_idx ON repo_topics(repo_id);
CREATE INDEX IF NOT EXISTS repo_topics_topic_idx ON repo_topics(topic);
CREATE INDEX IF NOT EXISTS board_cards_column_id_idx ON board_cards(column_id);
CREATE INDEX IF NOT EXISTS gists_author_id_idx ON gists(author_id);
CREATE INDEX IF NOT EXISTS gists_is_public_idx ON gists(is_public);
CREATE INDEX IF NOT EXISTS repo_snapshots_repo_id_idx ON repo_snapshots(repo_id);

NOTIFY pgrst, 'reload schema';
