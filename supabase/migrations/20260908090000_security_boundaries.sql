-- Billing and credentials are writable only by trusted server functions.
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cert_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscriptions, public.certifications, public.cert_attempts, public.course_purchases FROM anon, authenticated;
GRANT SELECT ON public.subscriptions, public.certifications, public.cert_attempts, public.course_purchases TO authenticated;
GRANT ALL ON public.subscriptions, public.certifications, public.cert_attempts, public.course_purchases TO service_role;
CREATE POLICY subscription_owner_read ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.uid() = '906e01d3-a655-4299-9269-437900cda4df'::uuid);
CREATE POLICY certificate_owner_read ON public.certifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.uid() = '906e01d3-a655-4299-9269-437900cda4df'::uuid);
CREATE POLICY attempt_owner_read ON public.cert_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.uid() = '906e01d3-a655-4299-9269-437900cda4df'::uuid);
CREATE POLICY purchase_owner_read ON public.course_purchases FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.uid() = '906e01d3-a655-4299-9269-437900cda4df'::uuid);

-- Public verification exposes only issued credentials, never payment identifiers.
CREATE OR REPLACE FUNCTION public.verify_public_certificate(code text)
RETURNS TABLE(cert_type text, issued_at timestamptz, verification_code text,
  certificate_url text, display_name text, username text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.cert_type, c.issued_at, c.verification_code, c.certificate_url, p.display_name, p.username
  FROM public.certifications c JOIN public.profiles p ON p.id = c.user_id
  WHERE c.verification_code = code AND c.certificate_url IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.verify_public_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_public_certificate(text) TO anon, authenticated;

ALTER TABLE public.certifications ADD COLUMN IF NOT EXISTS assessment_used boolean NOT NULL DEFAULT false;
UPDATE public.certifications SET assessment_used = true WHERE certificate_url IS NOT NULL;
CREATE TABLE public.assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  certificate_id uuid NOT NULL REFERENCES public.certifications(id),
  cert_type text NOT NULL,
  payment_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_active_assessment ON public.assessment_sessions(user_id, cert_type) WHERE result IS NULL;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assessment_sessions FROM anon, authenticated;
GRANT ALL ON public.assessment_sessions TO service_role;

-- Lock both rows so concurrent starts/submissions cannot spend one purchase twice.
CREATE OR REPLACE FUNCTION public.finish_assessment(session_id uuid, calculated_score integer,
  calculated_pass boolean, submitted_answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  attempt public.assessment_sessions;
  credential public.certifications;
  outcome jsonb;
  attempt_id uuid;
BEGIN
  SELECT * INTO STRICT attempt FROM public.assessment_sessions WHERE id = session_id;
  PERFORM pg_advisory_xact_lock(hashtextextended(attempt.user_id::text || attempt.cert_type, 0));
  SELECT * INTO STRICT attempt FROM public.assessment_sessions WHERE id = session_id FOR UPDATE;
  IF attempt.result IS NOT NULL THEN RETURN attempt.result; END IF;
  SELECT * INTO STRICT credential FROM public.certifications WHERE id = attempt.certificate_id FOR UPDATE;
  IF credential.stripe_payment_id IS DISTINCT FROM attempt.payment_id
    OR (credential.assessment_used AND attempt.cert_type <> 'git-fundamentals') THEN
    RAISE EXCEPTION 'Purchase already used or replaced';
  END IF;
  IF calculated_score < 0 OR calculated_score > 100 THEN RAISE EXCEPTION 'Invalid score'; END IF;
  IF now() > attempt.expires_at THEN calculated_score := 0; calculated_pass := false; END IF;
  INSERT INTO public.cert_attempts(user_id, cert_type, score, passed, answers)
    VALUES(attempt.user_id, attempt.cert_type, calculated_score, calculated_pass, submitted_answers)
    RETURNING id INTO attempt_id;
  IF calculated_pass THEN
    UPDATE public.certifications SET issued_at = now(),
      certificate_url = '/certificates/' || verification_code, assessment_used = true
      WHERE id = credential.id;
  ELSE
    UPDATE public.certifications SET assessment_used = true WHERE id = credential.id;
  END IF;
  outcome := jsonb_build_object('score', calculated_score, 'passed', calculated_pass, 'attemptId', attempt_id);
  UPDATE public.assessment_sessions SET result = outcome WHERE id = session_id;
  RETURN outcome;
END;
$$;
REVOKE ALL ON FUNCTION public.finish_assessment(uuid, integer, boolean, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_assessment(uuid, integer, boolean, jsonb) TO service_role;

ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.error_log FROM anon, authenticated;
GRANT INSERT ON public.error_log TO anon, authenticated;
GRANT SELECT ON public.error_log TO authenticated;
DROP POLICY IF EXISTS "Users can insert frontend errors" ON public.error_log;
CREATE POLICY frontend_error_insert ON public.error_log FOR INSERT TO anon, authenticated
  WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND length(error_message) <= 500 AND length(error_stack) <= 2000);
CREATE POLICY admin_error_read ON public.error_log FOR SELECT TO authenticated
  USING (auth.uid() = '906e01d3-a655-4299-9269-437900cda4df'::uuid);
NOTIFY pgrst, 'reload schema';
