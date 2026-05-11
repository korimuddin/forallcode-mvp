-- Persist profile pictures and profile cover images in Supabase.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-visuals', 'profile-visuals', true, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_position_x NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS cover_position_y NUMERIC DEFAULT 50;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Profile visuals are publicly readable'
  ) THEN
    CREATE POLICY "Profile visuals are publicly readable"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'profile-visuals');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users upload own profile visuals'
  ) THEN
    CREATE POLICY "Users upload own profile visuals"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'profile-visuals'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users update own profile visuals'
  ) THEN
    CREATE POLICY "Users update own profile visuals"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'profile-visuals'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'profile-visuals'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users delete own profile visuals'
  ) THEN
    CREATE POLICY "Users delete own profile visuals"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'profile-visuals'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;
END $$;
