# ForAllCode

A warm, human GitHub alternative prototype built from `FORALLCODE_SPEC.md`.

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and add Supabase and GitHub OAuth values when connecting real auth.

## Supabase setup

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/migrations/20260510031500_initial_schema.sql`.
3. Add these app env vars locally and in hosting:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GITHUB_CLIENT_ID`
4. In Supabase Auth, enable GitHub as an external provider.
5. Add `http://127.0.0.1:5173/auth/callback` to Supabase redirect URLs for local development.
