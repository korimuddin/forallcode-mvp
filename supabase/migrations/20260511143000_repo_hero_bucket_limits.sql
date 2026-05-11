-- Keep repo hero uploads small and explicitly allow common image formats.

UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'repo-heroes';
