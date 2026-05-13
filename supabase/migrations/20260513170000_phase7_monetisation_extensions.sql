-- Phase 7 monetisation extensions: custom domains, certifications,
-- marketplace courses, purchases/reviews, and premium desk themes.

CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  dns_configured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  cert_type TEXT NOT NULL,
  stripe_payment_id TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  certificate_url TEXT,
  verification_code TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT
);

CREATE TABLE IF NOT EXISTS cert_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  cert_type TEXT NOT NULL,
  score INT NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,
  price_gbp NUMERIC(10,2) NOT NULL,
  stripe_price_id TEXT,
  status TEXT DEFAULT 'draft',
  cover_image_url TEXT,
  lesson_count INT DEFAULT 0,
  student_count INT DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES marketplace_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  video_url TEXT,
  sort_order INT DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  duration_minutes INT
);

CREATE TABLE IF NOT EXISTS course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES marketplace_courses(id),
  stripe_payment_id TEXT,
  amount_gbp NUMERIC(10,2),
  author_payout_gbp NUMERIC(10,2),
  platform_fee_gbp NUMERIC(10,2),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES marketplace_courses(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS desk_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_pro BOOLEAN DEFAULT false,
  preview_colours JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO desk_themes (id, name, description, is_pro, preview_colours) VALUES
  ('classic', 'Classic', 'Warm cream and sage - the original ForAllCode desk', false, '{"desk":"#e8dfd0","monitor":"#e8e0d4","accent":"#9b8fd4"}'),
  ('cosy', 'Cosy', 'Warm amber tones - a firelit study', true, '{"desk":"#e8d5b0","monitor":"#f0e8d0","accent":"#c8a055"}'),
  ('minimal', 'Minimal', 'Cool white and slate - nothing in the way', true, '{"desk":"#f0f0ec","monitor":"#e8e8e4","accent":"#6a7a8c"}'),
  ('night-owl', 'Night owl', 'Deep ink tones for late-night sessions', true, '{"desk":"#2a2824","monitor":"#1e1b18","accent":"#9b8fd4"}')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS custom_domains_user_id_idx ON custom_domains(user_id);
CREATE INDEX IF NOT EXISTS certifications_user_id_idx ON certifications(user_id);
CREATE INDEX IF NOT EXISTS marketplace_courses_status_idx ON marketplace_courses(status);
CREATE INDEX IF NOT EXISTS course_purchases_user_id_idx ON course_purchases(user_id);
CREATE INDEX IF NOT EXISTS course_purchases_course_id_idx ON course_purchases(course_id);

NOTIFY pgrst, 'reload schema';
