CREATE OR REPLACE VIEW public_stats AS
SELECT
  (SELECT COUNT(*) FROM repositories) AS repo_count,
  (SELECT COUNT(*) FROM profiles) AS user_count,
  (SELECT COUNT(*) FROM learn_progress) AS lessons_started;

GRANT SELECT ON public_stats TO anon, authenticated;
