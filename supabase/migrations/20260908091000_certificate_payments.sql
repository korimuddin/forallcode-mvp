-- Remember payment grants so replayed webhooks cannot reset a consumed assessment.
CREATE TABLE public.certificate_payments (
  payment_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  cert_type text NOT NULL
);
ALTER TABLE public.certificate_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.certificate_payments FROM anon, authenticated;
GRANT ALL ON public.certificate_payments TO service_role;
INSERT INTO public.certificate_payments(payment_id, user_id, cert_type)
  SELECT stripe_payment_id, user_id, cert_type FROM public.certifications
  WHERE stripe_payment_id IS NOT NULL ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_certificate_payment(buyer uuid, kind text, payment text)
RETURNS public.certifications LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE credential public.certifications;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(buyer::text || kind, 0));
  SELECT * INTO credential FROM public.certifications WHERE user_id = buyer AND cert_type = kind
    ORDER BY issued_at DESC LIMIT 1 FOR UPDATE;
  INSERT INTO public.certificate_payments VALUES(payment, buyer, kind) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN credential; END IF;
  IF credential.id IS NULL THEN
    INSERT INTO public.certifications(user_id, cert_type, stripe_payment_id)
      VALUES(buyer, kind, payment) RETURNING * INTO credential;
  ELSE
    UPDATE public.certifications SET stripe_payment_id = payment, assessment_used = false
      WHERE id = credential.id RETURNING * INTO credential;
    UPDATE public.assessment_sessions SET result = '{"error":"Purchase replaced"}'::jsonb
      WHERE user_id = buyer AND cert_type = kind AND result IS NULL;
  END IF;
  RETURN credential;
END;
$$;
REVOKE ALL ON FUNCTION public.grant_certificate_payment(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_certificate_payment(uuid, text, text) TO service_role;
NOTIFY pgrst, 'reload schema';
