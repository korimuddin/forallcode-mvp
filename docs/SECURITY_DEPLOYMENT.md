# Security changes: deployment and verification

## Deployment order

These changes are not active in production until the database migrations and Netlify deployment are complete. Use a maintenance window: the old browser assessment flow cannot write results after the new access controls are applied.

1. Back up the database and test both new migrations against a staging copy. Audit existing certificates and payments: historical rows were previously writable by browsers and cannot automatically be treated as verified Stripe purchases.
2. Apply `20260908090000_security_boundaries.sql`, then `20260908091000_certificate_payments.sql` through the project's normal Supabase migration process.
3. Deploy the frontend and Netlify functions together. Keep `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and the webhook signing secret server-only. Configure `VITE_SUPABASE_URL`, `VITE_STRIPE_PRICE_MONTHLY`, and `VITE_STRIPE_PRICE_ANNUAL`; Netlify's `URL` and `DEPLOY_PRIME_URL` define allowed return origins.
4. Subscribe the Stripe webhook to `checkout.session.async_payment_succeeded` as well as its existing events. One-time purchases are granted only once payment is paid. No SDK or API version upgrade is included.

## Verification checklist

- Run `npm run build`, `npm run test:server`, and `npm test`. Browser tests own port 5187 and fail if it is occupied; they never reuse another server.
- In staging, confirm unauthenticated billing requests return 401, user A cannot access user B's purchases, and direct browser inserts/updates/deletes of billing, attempts, and credentials are denied.
- Complete a Stripe test-mode certificate purchase, submit passing and failing assessments, refresh an active assessment, and retry a submission. Confirm server expiry and one recorded result per session.
- Repurchase a consumed assessment, then replay an older checkout/webhook. Confirm the replay cannot reset the current entitlement. Existing Git Fundamentals retry rules are retained.
- Visit an issued certificate while signed out. Confirm verification returns no payment IDs or private user records; unissued certificates must not verify.
- Force a settings save failure and confirm the error is visible. Trigger a test frontend error and confirm it appears in the existing admin error log. Reporting uses Supabase, not an uninitialized Sentry global.
- Exercise authenticated repository, profile, workspace, and learning flows. Automated route checks cover public/signed-out render paths, not a real GitHub OAuth session.

## Local verification limits

The migrations have not been applied to a live database in this task. Unit tests cover authentication boundaries, grading, ownership filters, invalid answers, and duplicate results; they do not replace PostgreSQL concurrency/RLS tests or end-to-end Stripe test-mode checkout. Test these in staging before release. Large pre-existing vendor bundles still produce Vite size warnings.
