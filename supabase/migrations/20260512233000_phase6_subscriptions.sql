-- ForAllCode Phase 6 subscription infrastructure.

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly_gbp NUMERIC(10,2),
  stripe_price_id TEXT,
  private_repos_limit INT,
  sticky_notes_limit INT,
  landing_pages_limit INT,
  desk_themes_limit INT,
  readme_templates TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (
  id,
  name,
  price_monthly_gbp,
  private_repos_limit,
  sticky_notes_limit,
  landing_pages_limit,
  desk_themes_limit
)
VALUES
  ('free', 'Free', 0, 3, 5, 1, 1),
  ('pro', 'Pro', 10.0, NULL, NULL, NULL, 4)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  plan_id TEXT REFERENCES plans(id) DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upgrade_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_idx ON subscriptions(stripe_customer_id);

CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_id)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_free_subscription();

INSERT INTO subscriptions (user_id, plan_id)
SELECT id, 'free'
FROM profiles
ON CONFLICT (user_id) DO NOTHING;
