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
Prisma 7 (driver adapter `@prisma/adapter-pg`) · self-hosted Postgres ·
hand-rolled Google Sign-In auth (no third-party auth provider) · local-disk
file storage · React Hook Form + Zod · TanStack Query · Zustand · Recharts ·
Framer Motion · Web Speech API.

There is no third-party auth/database/storage vendor in the loop — Postgres
runs wherever you host it, sessions are signed JWT cookies the app issues
itself (see `src/lib/auth/`), and uploaded files land on local disk (see
`src/lib/upload.ts`).

## 1. Requirements

- Node.js 20+ and npm
- A Postgres instance you control (local, Docker, or your VPS)
- A [Google Cloud](https://console.cloud.google.com/apis/credentials) OAuth
  Client (sign-in is Google-only — see §3)
- Git

## 2. Install

```bash
npm install
```

This also runs `prisma generate` automatically (`postinstall` script).

## 3. Create a Google OAuth Client (required — sign-in is Google-only)

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
   Create a project if you don't have one yet.
2. **OAuth consent screen**: choose **External**, fill in the required app
   name/support email. While the app is in "Testing" mode, add your own
   Google account under **Test users** (otherwise Google blocks sign-in for
   everyone but the project owner).
3. **Credentials → Create Credentials → OAuth client ID → Web application.**
4. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/auth/callback` (local dev)
   - `https://your-production-domain/auth/callback` (once you have one)
5. Copy the **Client ID** and **Client secret** — you'll paste these into
   `.env` in the next step.

## 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL`/`DIRECT_URL` — your Postgres connection string (same value
  for both is fine at this scale; see §5 for a local/dev option).
- `AUTH_SECRET` — generate with `openssl rand -base64 48`.
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI` — from §3.
- `UPLOADS_DIR`/`NEXT_PUBLIC_UPLOADS_URL` — see §8.

See [`.env.example`](.env.example) for every variable, including the
dictionary/translation providers and VNPay (unrelated to auth).

## 5. Get a Postgres database

Any Postgres 14+ works. For local development, the quickest option is Docker:

```bash
docker run -d --name toeic-postgres -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -v toeic-postgres-data:/var/lib/postgresql/data postgres:16
```

Then set `DATABASE_URL`/`DIRECT_URL` in `.env` to
`postgresql://postgres:postgres@localhost:5432/toeic_mastery` (Postgres
creates the `toeic_mastery` database the first time Prisma connects and
migrates, as long as you connect to the default `postgres` database name
instead if your setup requires the DB to pre-exist — adjust as needed).

For production, this same container (or a native `apt install postgresql`)
runs on your own server — see the deploy section (§12).

## 6. Run database migrations

```bash
npm run db:migrate
```

This creates every table in `prisma/schema.prisma`.

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

## 8. File uploads (local disk)

Avatars, question images/audio, and bank QR images are written to
`UPLOADS_DIR` (an absolute path — keep it **outside** this repo's own
directory so redeploys never wipe uploads) and served back at
`NEXT_PUBLIC_UPLOADS_URL`. For local development:

```bash
mkdir -p /tmp/toeic-uploads
```

...and set in `.env`:
```
UPLOADS_DIR="/tmp/toeic-uploads"
NEXT_PUBLIC_UPLOADS_URL="http://localhost:3000/uploads"
```

`next dev`/`next start` don't serve `UPLOADS_DIR` automatically — for local
testing, either point `NEXT_PUBLIC_UPLOADS_URL` at a separate static file
server you run yourself, or (simplest for local dev) set `UPLOADS_DIR` to a
path under `public/uploads` so Next's own static file serving picks it up.
In production, Nginx serves this path directly — see §12.

## 9. Create your admin account

1. Sign in once with Google at `/login` — this creates your account.
2. Promote it to admin:

   ```bash
   npm run db:promote-admin -- you@example.com
   ```

3. Sign out and back in — you'll see **Quản trị** in the sidebar, linking to
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

## 12. Deploy to your own VPS

No third-party PaaS/BaaS in this setup — the app, its Postgres database,
and uploaded files all live on one server you control.

1. **Postgres**: run it as a Docker container (see §5's `docker run`
   command — same idea, just on the server instead of your laptop; give it
   a strong password and keep it bound to `127.0.0.1`, not exposed
   publicly), or install Postgres natively (`apt install postgresql`).
2. **App**: clone this repo onto the server, `cp .env.example .env` and
   fill in production values (`GOOGLE_REDIRECT_URI` and the Google OAuth
   Client's redirect URI must both be your real
   `https://your-domain/auth/callback`), then:
   ```bash
   npm ci
   npm run build
   npm run db:migrate
   npm run db:seed   # first deploy only
   ```
3. **Process manager**: keep `npm run start` running persistently — [PM2](https://pm2.keymetrics.io/)
   is the simplest option:
   ```bash
   npm install -g pm2
   pm2 start npm --name toeic-mastery -- start
   pm2 save
   pm2 startup   # prints a command to run once, so PM2 survives a reboot
   ```
4. **Nginx**: reverse-proxy to the Next.js port (default 3000) and serve
   `UPLOADS_DIR` directly as static files at `/uploads/`:
   ```nginx
   server {
     listen 80;
     server_name your-domain;
     client_max_body_size 60m; # question-media images/audio can be up to 50MB

     location /uploads/ {
       alias /var/app-uploads/;
     }

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```
   Then get HTTPS via [Certbot](https://certbot.eff.org/) (`certbot --nginx`).
5. **Cron jobs**: `vercel.json`'s two cron entries have no Vercel-specific
   code — replicate them with a plain crontab hitting the same routes:
   ```bash
   # crontab -e
   0 1 * * * curl -fsS https://your-domain/api/cron/confirm-commissions
   0 12 * * * curl -fsS https://your-domain/api/cron/daily-reminders
   ```
   (add whatever auth header those routes expect, if any).
6. To ship a code change later: `git pull && npm ci && npm run build && pm2 restart toeic-mastery`.

## Project structure

```
src/
  app/
    (auth)/            login (Google Sign-In only) + sign-out action
    auth/callback/       Google OAuth code-exchange Route Handler
    (app)/              authenticated app shell: dashboard, practice, exam,
                         listening, reading, grammar, vocabulary, dictionary,
                         history, analytics, bookmarks, profile, settings
    admin/               admin-only CMS (tests, questions, vocabulary, users)
    api/                 route handlers (exam sync/submit, dictionary, search,
                         auth/google, upload/*)
  components/
    ui/                  shadcn/ui primitives
    layout/, exam/, dictionary/, vocabulary/, grammar/, history/,
    analytics/, admin/, shared/, profile/, settings/, skills/
  lib/
    actions/             Server Actions (mutations)
    auth/                 session (signed JWT cookie) + Google OAuth helpers
    data/                read-only data-access functions (Server Components)
    services/            ScoreCalculator, DictionaryService, TranslationService,
                         spaced repetition (SM-2), rule-based recommendations
    upload.ts             local-disk file storage helper
    validations/          Zod schemas
  store/                 Zustand stores (exam runner, client settings)
  hooks/                 client hooks (dictionary lookup, text selection, exam sync)
  generated/prisma/       generated Prisma Client (gitignored, regenerated on install)
prisma/
  schema.prisma          full data model (~25 tables)
  seed.ts, seed-data/     original TOEIC-style seed content
  promote-admin.ts        CLI to grant the ADMIN role
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
