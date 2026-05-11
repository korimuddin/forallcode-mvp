-- Persist Learn Centre onboarding comfort-level selection.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS learn_comfort_level TEXT;
