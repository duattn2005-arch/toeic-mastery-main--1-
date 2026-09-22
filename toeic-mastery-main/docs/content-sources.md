# Content sources

This document tracks where every piece of content in TOEIC Mastery comes
from, so it stays auditable as the question bank grows.

## Seed database (`prisma/seed-data/`, `prisma/seed.ts`)

All questions, passages, vocabulary, and grammar lessons in the seed
database are **original content, written for this project** — TOEIC-style
practice material, not reproductions of any ETS exam or any other TOEIC prep
platform's paid content. Contexts follow the same everyday business
situations the real TOEIC uses (office, meetings, travel, airport, hotel,
shipping, HR, manufacturing, etc.), but every sentence, dialogue, passage,
and explanation was authored fresh for this seed set.

Known gaps in the checked-in seed set (the `prisma/seed-data/*.ts` files
themselves never carry `imageUrl`/`audioUrl` — grep confirms it), but
**closed in the live database** as of 2026-09-22: an admin has since
attached real Part 1 photos and real listening audio directly via
`/admin/questions` on the running site, on top of the seed rows. So the
gap only applies to a *fresh* `prisma db seed` re-run, not to the current
production data.

- **Part 1 photographs**: seed rows only carry a `sceneNote` (see
  `prisma/seed-data/part1.ts`) describing what the photo should show — no
  `imageUrl` in the seed script. The live DB now has real photos attached
  per question via `/admin/questions` (royalty-free stock or original).
  Re-seeding from scratch would wipe that and need the photos re-attached.
- **Listening audio**: seed rows ship with a full `transcript` but no
  `.mp3`; the player falls back to the browser's Web Speech API only when
  `audioUrl` is empty. The live DB now has real narration uploaded to the
  `question-media` Supabase Storage bucket with `audioUrl` set per
  question/passage. Same caveat: a from-scratch reseed would lose this.
- **Question volume**: the seed set covers the *minimum* bar the spec
  called for (30 Part 5, ~12 Part 6, 15 Part 7, 10 Part 3 conversations,
  4 Part 4 talks, 6 Part 1, 10 Part 2) rather than a full 200-question ×
  3-test bank. `Mock Test 01` is fully playable end-to-end; `Mock Test 02`
  and `03` exist as metadata placeholders (`status: DRAFT`) ready to be
  filled in via the admin question editor or the JSON import tool
  (`/admin/questions` → "Import JSON").

## Approved free/legal sources for expanding the bank

Use these when adding real content later — do not scrape paid TOEIC prep
sites (PassToeic or otherwise) or reproduce copyrighted ETS exam material.

- **Original authoring** (recommended default): write new TOEIC-style
  items yourself or with a licensed writer, following the structure in
  `prisma/seed-data/*.ts`.
- **Free dictionary data**: [dictionaryapi.dev](https://dictionaryapi.dev)
  (English definitions, IPA, audio) — already wired up as the default
  `DictionaryService` provider, keyless, CC-friendly.
- **Free translation**: [MyMemory](https://mymemory.translated.net) — used
  as the default `TranslationService` provider for English→Vietnamese
  meanings. Rate-limited; fine for development, replace with Google Cloud
  Translation or DeepL (paid) for production volume.
- **Royalty-free stock photography** for Part 1 images: sources such as
  Unsplash, Pexels, or Pixabay under their respective free-use licenses.
  Always check the specific license terms before use in a commercial
  product, and keep an attribution note if the license requires one.
- **Public-domain / CC-licensed grammar references** for expanding theory
  content: general ESL grammar explanations (not TOEIC-specific
  proprietary material) rewritten in your own words.

## Import pipeline

Admins can bulk-add Part 5/6/7-style questions via **Admin → Câu hỏi →
Import JSON**, using the schema documented there and validated with Zod
(`src/lib/validations/admin.ts` → `importQuestionSchema`). Imported items
land in `DRAFT` status so an editor reviews them before they go live.
