-- Store lock-in sessions for history and analytics.
CREATE TABLE IF NOT EXISTS lockin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  duration_hours NUMERIC(4,2) NOT NULL,
  tasks JSONB NOT NULL DEFAULT '[]',
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  tasks_completed INT DEFAULT 0,
  tasks_total INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lockin_user_idx ON lockin_sessions(user_id);

NOTIFY pgrst, 'reload schema';
