# TOEIC Mastery

Nền tảng luyện thi TOEIC toàn diện: kho đề thi thử, Listening/Reading đầy đủ
7 Part, từ điển thông minh (bôi đen để tra từ ở bất kỳ đâu trên trang),
flashcard từ vựng với lặp lại ngắt quãng (SM-2), phân tích điểm yếu theo
từng Part, và trang quản trị nội dung.

Toàn bộ nội dung đề thi trong seed database là **nguyên bản, tự biên soạn**
— xem [`docs/content-sources.md`](docs/content-sources.md) để biết chi tiết
nguồn và giới hạn đã biết (chưa có ảnh Part 1 và audio thật — xem mục đó).

## Tech stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · shadcn/ui ·
Prisma 7 (driver adapter `@prisma/adapter-pg`) · Supabase (Postgres, Auth,
Storage) · React Hook Form + Zod · TanStack Query · Zustand · Recharts ·
Framer Motion · Web Speech API.

## 1. Requirements

- Node.js 20+ and npm
- A [Supabase](https://supabase.com) project (free tier is enough to start)
- Git

## 2. Install

```bash
npm install
```

This also runs `prisma generate` automatically (`postinstall` script).

## 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Once created, open **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, server-only)
3. Open **Project Settings → Database** and copy two connection strings:
   - **Transaction pooler** (port 6543) → `DATABASE_URL` (add `?pgbouncer=true`)
   - **Session pooler or direct connection** (port 5432) → `DIRECT_URL`
4. (Optional, for "Tiếp tục với Google") By default the Google provider is
   **disabled** — clicking the button will fail with a provider error until
   you set this up: in **Authentication → Providers**, enable Google and
   paste OAuth Client ID/Secret from
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   In Google Cloud, add `https://[project-ref].supabase.co/auth/v1/callback`
   as an authorized redirect URI. Email/password login works without this
   step — it's a separate, independent auth method.

## 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in the values from step 3. See [`.env.example`](.env.example) for a
description of every variable (dictionary/translation providers included).

## 5. Run database migrations

```bash
npm run db:migrate
```

This creates every table in `prisma/schema.prisma` on your Supabase
database.

## 6. Run the Supabase-only SQL (auth trigger, RLS, storage)

Prisma manages the `public` schema tables, but three things live outside
Prisma's reach and must be run once via the **Supabase SQL Editor** (in
order):

1. [`supabase/sql/001_profile_trigger.sql`](supabase/sql/001_profile_trigger.sql) —
   auto-creates a `profiles` row whenever someone signs up.
2. [`supabase/sql/002_row_level_security.sql`](supabase/sql/002_row_level_security.sql) —
   enables Row Level Security on every table (defense-in-depth for
   Supabase's auto-generated REST API; the app's own server bypasses this
   via the Postgres role and enforces authorization in code — see
   `src/lib/auth.ts`).
3. [`supabase/sql/003_storage.sql`](supabase/sql/003_storage.sql) — creates
   the `avatars` and `question-media` Storage buckets with their access
   policies. (Alternatively, create the two buckets manually from
   **Storage** in the dashboard and skip the `insert` statements.)

## 7. Seed the database

```bash
npm run db:seed
```

This populates: 15 vocabulary topics (~95 words), 15 grammar topics
(theory + examples + practice questions), and 3 tests — `Mock Test 01` is
fully playable (115 original questions across all 7 Parts), `Mock Test 02`
and `03` are draft placeholders ready for more content.

Re-running `npm run db:seed` is safe — it upserts vocabulary/grammar and
rebuilds `Mock Test 01` from scratch each time.

## 8. Email confirmation (important for local testing)

Supabase's **"Confirm email"** setting is on by default: after `/register`,
the account exists but has no active session until the user clicks the
confirmation link sent to their inbox — signing in before that fails with
"Email not confirmed" (the app now shows this clearly instead of silently
bouncing you back to `/login`).

For local development, either:

- Check the inbox and click the confirmation link, **or**
- Skip email entirely and confirm the account directly:

  ```bash
  npm run db:confirm-user -- you@example.com
  ```

- Or disable confirmation altogether for a dev/staging project in
  **Supabase Dashboard → Authentication → Providers → Email → uncheck
  "Confirm email"** (leave this **on** for production).

## 9. Create your admin account

1. Sign up a real account at `/register` (see §8 if login fails right after).
2. Promote that account to admin:

   ```bash
   npm run db:promote-admin -- you@example.com
   ```

3. Sign back in — you'll see **Quản trị** in the sidebar, linking to
   `/admin`.

## 10. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 11. Build for production

```bash
npm run build
npm run start
```

`npm run build` runs `prisma generate` first, then `next build`. This repo
builds with zero TypeScript errors and zero ESLint errors (`npm run
typecheck`, `npm run lint`).

## 12. Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add all variables from `.env.example` in **Project Settings →
   Environment Variables** (use your real Supabase values — same ones as
   local `.env`, plus set `NEXT_PUBLIC_SITE_URL` to your production domain).
4. Deploy. Vercel runs `npm run build` (→ `prisma generate && next build`)
   automatically; no extra build command needed.
5. Run `npm run db:migrate` and `npm run db:seed` from your local machine
   (pointed at the production `DATABASE_URL`/`DIRECT_URL`) before or right
   after the first deploy, plus the Supabase SQL Editor steps from §6.

## Project structure

```
src/
  app/
    (auth)/            login, register, forgot-password + server actions
    (app)/              authenticated app shell: dashboard, practice, exam,
                         listening, reading, grammar, vocabulary, dictionary,
                         history, analytics, bookmarks, profile, settings
    admin/               admin-only CMS (tests, questions, vocabulary, users)
    api/                 route handlers (exam sync/submit, dictionary, search)
  components/
    ui/                  shadcn/ui primitives
    layout/, exam/, dictionary/, vocabulary/, grammar/, history/,
    analytics/, admin/, shared/, profile/, settings/, skills/
  lib/
    actions/             Server Actions (mutations)
    data/                read-only data-access functions (Server Components)
    services/            ScoreCalculator, DictionaryService, TranslationService,
                         spaced repetition (SM-2), rule-based recommendations
    supabase/             Supabase browser/server clients + proxy session helper
    validations/          Zod schemas
  store/                 Zustand stores (exam runner, client settings)
  hooks/                 client hooks (dictionary lookup, text selection, exam sync)
  generated/prisma/       generated Prisma Client (gitignored, regenerated on install)
prisma/
  schema.prisma          full data model (~25 tables)
  seed.ts, seed-data/     original TOEIC-style seed content
  promote-admin.ts        CLI to grant the ADMIN role
supabase/sql/              SQL that must run outside Prisma (see §6)
docs/content-sources.md    content provenance and licensing notes
```

## Known production TODOs

- **Audio/photos**: see "Known gaps" in `docs/content-sources.md` — the
  seed set has no real narration or Part 1 photos yet; the app degrades
  gracefully (Web Speech API fallback, no image shown) until you add them.
- **Rate limiting** (`src/lib/rate-limit.ts`) is in-memory and per-instance
  — fine for a single Node server, swap for Upstash/Redis before scaling
  to multiple instances.
- **Score conversion table**: `ScoreCalculator` ships a smooth estimated
  0–990 curve, clearly labeled "Điểm ước tính" in the UI, never claimed as
  the official ETS table. An admin can plug in a licensed conversion table
  via the `ScoreConversionTable` model (no UI screen for editing it yet —
  currently insert/update via Prisma Studio or a migration).
- **Daily reminder notifications**: the setting exists and persists
  (`UserSettings.dailyReminderEnabled/Time`) but no email/push sender is
  wired up yet.
- **Drag-and-drop question ordering** in the admin test editor was
  descoped in favor of a numeric `orderIndex` — reasonable per the original
  spec's own "if it makes sense" qualifier, but a nicer editor is a
  natural next step.
