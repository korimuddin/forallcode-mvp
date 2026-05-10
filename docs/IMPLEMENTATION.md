# ForAllCode MVP Implementation Notes

This build follows `FORALLCODE_SPEC.md` as a Vite React application with Tailwind CSS tokens, Supabase connection points, GitHub OAuth scopes, and Netlify/Cloudflare-style SPA routing.

## Included MVP surface

- Public pages: landing, about, login, learn preview/full learn, public profile, public repo, explore.
- Authenticated pages: dashboard, workspace, my profile, repos list, repo owner view, README Studio, Landing Page Designer.
- Settings pages: account, profile, workspace, notifications, integrations, privacy, appearance, danger.
- Shared components: button, card, avatar, badge, language pill, command palette, top nav, footer.
- Signature interactions: command palette, editable workspace notes, checkable todos, live clock, focus mode, README live preview, landing designer live preview, lesson switching.

## Connect real services

1. Copy `.env.example` to `.env`.
2. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GITHUB_CLIENT_ID`.
3. Run `supabase/migrations/20260510031500_initial_schema.sql` in your Supabase project.
4. Configure GitHub OAuth with `repo` and `user:email` scopes.
5. Replace the mock arrays in `src/main.jsx` with Supabase queries as each MVP phase moves from prototype to live data.
