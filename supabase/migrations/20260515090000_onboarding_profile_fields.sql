-- First-time onboarding state for new GitHub OAuth users.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_goal TEXT,
  ADD COLUMN IF NOT EXISTS git_comfort_level TEXT;

NOTIFY pgrst, 'reload schema';
