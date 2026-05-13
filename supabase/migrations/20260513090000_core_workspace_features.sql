-- ForAllCode core workspace features.

-- Issues
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  assignee_id UUID REFERENCES profiles(id),
  number INT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'open',
  label TEXT,
  linked_note_id UUID REFERENCES workspace_notes(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  UNIQUE(repo_id, number)
);

-- Issue comments
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaborators
CREATE TABLE IF NOT EXISTS collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'contributor',
  invited_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(repo_id, user_id)
);

-- Pull requests
CREATE TABLE IF NOT EXISTS pull_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  number INT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'open',
  head_branch TEXT NOT NULL,
  base_branch TEXT NOT NULL DEFAULT 'main',
  github_pr_number INT,
  reviews_required INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  merged_at TIMESTAMPTZ,
  UNIQUE(repo_id, number)
);

-- PR reviews
CREATE TABLE IF NOT EXISTS pr_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id UUID REFERENCES pull_requests(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending',
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PR comments
CREATE TABLE IF NOT EXISTS pr_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id UUID REFERENCES pull_requests(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  file_path TEXT,
  line_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File edits (audit trail)
CREATE TABLE IF NOT EXISTS file_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  file_path TEXT NOT NULL,
  commit_message TEXT NOT NULL,
  github_commit_sha TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS issues_repo_id_idx ON issues(repo_id);
CREATE INDEX IF NOT EXISTS issues_status_idx ON issues(status);
CREATE INDEX IF NOT EXISTS issue_comments_issue_id_idx ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS collaborators_repo_id_idx ON collaborators(repo_id);
CREATE INDEX IF NOT EXISTS collaborators_user_id_idx ON collaborators(user_id);
CREATE INDEX IF NOT EXISTS pull_requests_repo_id_idx ON pull_requests(repo_id);
CREATE INDEX IF NOT EXISTS pr_comments_pr_id_idx ON pr_comments(pr_id);
CREATE INDEX IF NOT EXISTS file_edits_repo_id_idx ON file_edits(repo_id);

-- Auto-increment issue number per repo
CREATE OR REPLACE FUNCTION next_issue_number(p_repo_id UUID)
RETURNS INT AS $$
  SELECT COALESCE(MAX(number), 0) + 1 FROM issues WHERE repo_id = p_repo_id;
$$ LANGUAGE SQL;

-- Auto-increment PR number per repo
CREATE OR REPLACE FUNCTION next_pr_number(p_repo_id UUID)
RETURNS INT AS $$
  SELECT COALESCE(MAX(number), 0) + 1 FROM pull_requests WHERE repo_id = p_repo_id;
$$ LANGUAGE SQL;

-- Supabase API access and row-level security.
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_edits ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON issues, issue_comments, collaborators, pull_requests, pr_reviews, pr_comments, file_edits TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON issues, issue_comments, collaborators, pull_requests, pr_reviews, pr_comments, file_edits TO authenticated;
GRANT EXECUTE ON FUNCTION next_issue_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION next_pr_number(UUID) TO authenticated;

CREATE POLICY "Issues are readable for visible repositories"
  ON issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = issues.repo_id
        AND (repositories.is_private = false OR repositories.owner_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create issues on visible repositories"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = issues.repo_id
        AND (repositories.is_private = false OR repositories.owner_id = auth.uid())
    )
  );

CREATE POLICY "Issue authors and repo owners can update issues"
  ON issues FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = issues.repo_id
        AND repositories.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = issues.repo_id
        AND repositories.owner_id = auth.uid()
    )
  );

CREATE POLICY "Issue comments are readable with their issue"
  ON issue_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM issues
      JOIN repositories ON repositories.id = issues.repo_id
      WHERE issues.id = issue_comments.issue_id
        AND (repositories.is_private = false OR repositories.owner_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can comment on visible issues"
  ON issue_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM issues
      JOIN repositories ON repositories.id = issues.repo_id
      WHERE issues.id = issue_comments.issue_id
        AND (repositories.is_private = false OR repositories.owner_id = auth.uid())
    )
  );

CREATE POLICY "Comment authors can update comments"
  ON issue_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Collaborators are readable for visible repositories"
  ON collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = collaborators.repo_id
        AND (repositories.is_private = false OR repositories.owner_id = auth.uid())
    )
    OR collaborators.user_id = auth.uid()
  );

CREATE POLICY "Pull requests are readable for visible repositories"
  ON pull_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = pull_requests.repo_id
        AND (repositories.is_private = false OR repositories.owner_id = auth.uid())
    )
  );

CREATE POLICY "PR reviews are readable with their pull request"
  ON pr_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pull_requests
      JOIN repositories ON repositories.id = pull_requests.repo_id
      WHERE pull_requests.id = pr_reviews.pr_id
        AND (repositories.is_private = false OR repositories.owner_id = auth.uid())
    )
  );

CREATE POLICY "PR comments are readable with their pull request"
  ON pr_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pull_requests
      JOIN repositories ON repositories.id = pull_requests.repo_id
      WHERE pull_requests.id = pr_comments.pr_id
        AND (repositories.is_private = false OR repositories.owner_id = auth.uid())
    )
  );

CREATE POLICY "File edits are readable for visible repositories"
  ON file_edits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = file_edits.repo_id
        AND (repositories.is_private = false OR repositories.owner_id = auth.uid())
    )
  );

NOTIFY pgrst, 'reload schema';
