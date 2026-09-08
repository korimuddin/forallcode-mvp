# Navigation component integration

The supplied Radix navigation component is implemented in `src/components/ui/navigation-menu.tsx` and used by `src/components/layout/TopNav.jsx`. The demo destinations are replaced with existing ForAllCode routes; React Router links preserve client-side navigation. No Next.js dependency is needed.

The project already uses Tailwind CSS 3 and `src/components/ui`. Keep reusable UI primitives there rather than creating a second root-level `components` directory. Vite and TypeScript now resolve `@/` to `src/`, and `components.json` records the shadcn-compatible paths.

TypeScript support is incremental: run `npm run typecheck` for the new `.ts` and `.tsx` files. Existing JavaScript pages are unchanged by this configuration. Tailwind scans both JavaScript and TypeScript components.

The supplied Tailwind 4 animation and theme classes are adapted to scoped CSS in `src/components/ui/navigation-menu.css`. It uses the existing light/dark tokens and keeps square corners. The shared component retains all named exports and optional viewport support; the app uses `viewport={false}` with inline mobile panels below the existing 1240px breakpoint.

Radix handles menu focus, keyboard movement, dismissal and trigger state. App state closes mobile navigation after a route change; outside clicks and Escape also dismiss it. Existing search, notifications, account actions and subscription controls are preserved.

Dependencies: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge` (Tailwind 3 compatible), TypeScript and React types. Lucide was already installed. No stock images or placeholder documentation routes were added to the working navigation.

Verification: `npm run typecheck`, `npm run build`, and `npm test`. Navigation tests seed a fake session in their isolated browser, intercept Supabase requests, and exercise keyboard navigation, routing and light/dark layouts at desktop, tablet and phone sizes. They do not modify real account data.
