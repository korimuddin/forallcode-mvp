-- Store repository hero images in Supabase Storage and keep display settings
-- on the repositories row.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('repo-heroes', 'repo-heroes', true, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

ALTER TABLE repositories
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_position_x NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS hero_position_y NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS hero_title TEXT,
  ADD COLUMN IF NOT EXISTS hero_font TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Repo hero images are publicly readable'
  ) THEN
    CREATE POLICY "Repo hero images are publicly readable"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'repo-heroes');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users upload own repo hero images'
  ) THEN
    CREATE POLICY "Users upload own repo hero images"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'repo-heroes'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users update own repo hero images'
  ) THEN
    CREATE POLICY "Users update own repo hero images"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'repo-heroes'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'repo-heroes'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users delete own repo hero images'
  ) THEN
    CREATE POLICY "Users delete own repo hero images"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'repo-heroes'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;
END $$;
