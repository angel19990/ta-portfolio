# ta-portfolio

Truthful Acting Studios student/industry portfolio platform — Next.js 16 + Supabase.

## What it is

A role-based web app connecting acting students, industry partners (casting directors / agents), and studio admins.

- **Admins** approve new accounts, manage students/classes, and review casting calls.
- **Industry** users post casting calls with file attachments and see student applications.
- **Students** maintain a public actor profile (headshot, photo gallery, resume, personal details) and apply to casting calls.

## Tech stack

- **Next.js 16.2.4** — App Router, Turbopack, Server Actions
- **React 19**
- **Supabase** — Auth, Postgres (with RLS), Storage
- **Tailwind v4** + **base-ui** + **shadcn**
- **react-hook-form** + **zod** for forms/validation
- **react-easy-crop** for headshot cropping
- **next-themes** for light/dark
- **sonner** for toasts

## Local setup

1. `cp .env.local.example .env.local` and fill in the four values.
2. `npm install`
3. `npm run dev` → http://localhost:3000

## Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Project URL, e.g. `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Used by admin operations + scripts. **Never** ship to the client. |
| `NEXT_PUBLIC_SITE_URL` | auth callbacks, seed scripts | Must match the deployed URL in production |

## Scripts

Each one-off task runs with `node --env-file=.env.local scripts/<file>.mjs`:

- `seed-admin.mjs <email> "<name>"` — invite the first admin and create their profile row.
- `seed-student.mjs <email> "<name>"` — invite a student.
- `seed-industry.mjs <email> "<name>"` — invite an industry user.
- `seed-classes.mjs` — seed class catalog data.
- `generate-invite-link.mjs <email>` — print a fresh signup link.
- `set-password.mjs <email> <password>` — admin password reset.
- `delete-user.mjs <email>` — remove a user from auth + profiles.

## Database

Migrations live in `supabase/migrations/`. Apply via the Supabase CLI or paste into the SQL editor. RLS is enabled on every table — see each migration for the policy details.

## Deploy

Deployed on Vercel. The four env vars above must be set in the project settings. `next.config.ts` derives the Supabase image hostname from `NEXT_PUBLIC_SUPABASE_URL` at build time, so no extra config is needed for images.
