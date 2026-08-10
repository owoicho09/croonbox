# Croonbox

Structured, asynchronous video interviews for hiring teams — with qualitative AI insights,
not numeric scores.

## Stack

- Next.js App Router + TypeScript
- Drizzle ORM over Supabase Postgres
- Hand-rolled session auth (argon2 + httpOnly cookies) — no Supabase Auth
- Supabase Storage for private candidate video, uploaded via signed URLs
- Resend for transactional email
- Stripe for the Professional plan subscription
- OpenAI for transcription + qualitative interview insights

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — a Supabase Postgres connection string
   - `AUTH_SECRET` — any random 32+ byte value (`openssl rand -hex 32`)
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET` — for video storage (server-only)
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — same project, used by the candidate's
     browser to upload directly to Storage via a short-lived signed token
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL`
   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_PROFESSIONAL`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000`
   - `CRON_SECRET` — any random value, required by `/api/cron/process`
3. In Supabase, create a **private** Storage bucket matching `SUPABASE_STORAGE_BUCKET`.
4. Run the migration: `npx drizzle-kit migrate` (or apply `lib/db/migrations/0000_*.sql` directly).
5. `npm run dev`

## Background processing

Transcription and AI insight generation run as a small database-backed job queue
(`processing_jobs` table), not a separate worker process — this keeps the app portable across
hosts that may not offer a persistent worker or a queue service.

Something needs to call `POST /api/cron/process` (with header `Authorization: Bearer $CRON_SECRET`)
on an interval — every 1–2 minutes is reasonable. Use Vercel Cron, a cPanel cron job with `curl`,
or any external scheduler pointed at your deployed URL.

## Stripe webhook

Point a Stripe webhook at `POST /api/webhooks/stripe` for at least:
`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`.

## Platform admin

`/admin` is gated on `users.is_platform_admin = true`. There's no UI to grant this — set it
directly in the database for your own operator account:

```sql
update users set is_platform_admin = true where email = 'you@company.com';
```
