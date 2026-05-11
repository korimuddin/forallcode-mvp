-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  pronouns TEXT,
  location TEXT,
  website TEXT,
  avatar_style TEXT DEFAULT 'sage',
  avatar_url TEXT,
  cover_gradient TEXT,
  cover_image_url TEXT,
  cover_position_x NUMERIC DEFAULT 50,
  cover_position_y NUMERIC DEFAULT 50,
  github_username TEXT,
  learn_comfort_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repositories (synced from GitHub API)
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  github_repo_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT,
  is_private BOOLEAN DEFAULT false,
  stars_count INT DEFAULT 0,
  forks_count INT DEFAULT 0,
  readme_content TEXT,
  landing_page_html TEXT,
  hero_image_url TEXT,
  hero_position_x NUMERIC DEFAULT 50,
  hero_position_y NUMERIC DEFAULT 50,
  hero_title TEXT,
  hero_font TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace sticky notes
CREATE TABLE workspace_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  repo_id UUID REFERENCES repositories(id),
  colour TEXT DEFAULT 'lavender',
  content TEXT,
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace to-do items
CREATE TABLE workspace_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace settings
CREATE TABLE workspace_settings (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  focus_mode BOOLEAN DEFAULT false,
  desk_theme TEXT DEFAULT 'classic',
  show_clock BOOLEAN DEFAULT true,
  show_decorations BOOLEAN DEFAULT true
);

-- Learn progress
CREATE TABLE learn_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  lesson_slug TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_slug)
);

-- Follows
CREATE TABLE follows (
  follower_id UUID REFERENCES profiles(id),
  following_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Stars
CREATE TABLE stars (
  user_id UUID REFERENCES profiles(id),
  repo_id UUID REFERENCES repositories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, repo_id)
);
