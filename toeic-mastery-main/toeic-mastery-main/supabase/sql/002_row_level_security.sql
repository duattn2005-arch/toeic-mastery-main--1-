-- Row Level Security for the Supabase auto-generated REST/Realtime API.
--
-- The app's own server (Server Components / Server Actions / Route Handlers)
-- talks to Postgres through Prisma using the `postgres` role, which bypasses
-- RLS — authorization for that path is enforced in application code
-- (see src/lib/auth.ts: requireUser / requireAdmin). These policies are a
-- second line of defense that lock down Supabase's PostgREST/Realtime layer
-- (the `anon` / `authenticated` roles tied to the publishable/anon key) so
-- content only ever reaches the owning user, and Supabase's dashboard does
-- not flag these tables as "RLS disabled".
--
-- Run this once in the Supabase SQL editor after `prisma migrate deploy`.

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.bookmarks enable row level security;
alter table public.question_reports enable row level security;
alter table public.user_vocabulary enable row level security;
alter table public.vocabulary_reviews enable row level security;
alter table public.study_sessions enable row level security;
alter table public.score_history enable row level security;
alter table public.dictionary_history enable row level security;
alter table public.saved_words enable row level security;

-- Public read-only content tables (tests, questions, vocabulary, grammar,...)
-- stay RLS-enabled with a single "published content is public" read policy;
-- writes are only ever performed by the trusted server (Prisma), never via
-- the anon/authenticated PostgREST role.
alter table public.tests enable row level security;
alter table public.test_sections enable row level security;
alter table public.passages enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.vocabulary_topics enable row level security;
alter table public.vocabulary_words enable row level security;
alter table public.grammar_topics enable row level security;
alter table public.grammar_lessons enable row level security;
alter table public.dictionary_entries enable row level security;
alter table public.score_conversion_tables enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- user_settings
create policy "user_settings_owner" on public.user_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- attempts / attempt_answers
create policy "attempts_owner" on public.attempts
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());
create policy "attempt_answers_owner" on public.attempt_answers
  for all using (
    exists (select 1 from public.attempts a where a.id = attempt_id and (a.user_id = auth.uid() or public.is_admin()))
  )
  with check (
    exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid())
  );

-- bookmarks / reports / vocabulary progress / sessions / history — all owner-scoped
create policy "bookmarks_owner" on public.bookmarks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "question_reports_owner_select" on public.question_reports
  for select using (user_id = auth.uid() or public.is_admin());
create policy "question_reports_owner_insert" on public.question_reports
  for insert with check (user_id = auth.uid());
create policy "user_vocabulary_owner" on public.user_vocabulary
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "vocabulary_reviews_owner" on public.vocabulary_reviews
  for all using (
    exists (select 1 from public.user_vocabulary uv where uv.id = user_vocabulary_id and uv.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.user_vocabulary uv where uv.id = user_vocabulary_id and uv.user_id = auth.uid())
  );
create policy "study_sessions_owner" on public.study_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "score_history_owner" on public.score_history
  for select using (user_id = auth.uid() or public.is_admin());
create policy "dictionary_history_owner" on public.dictionary_history
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "saved_words_owner" on public.saved_words
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Public read-only content
create policy "tests_public_read" on public.tests
  for select using (status = 'PUBLISHED' or public.is_admin());
create policy "test_sections_public_read" on public.test_sections
  for select using (true);
create policy "passages_public_read" on public.passages
  for select using (true);
create policy "questions_public_read" on public.questions
  for select using (status = 'PUBLISHED' or public.is_admin());
create policy "question_options_public_read" on public.question_options
  for select using (true);
create policy "vocabulary_topics_public_read" on public.vocabulary_topics
  for select using (true);
create policy "vocabulary_words_public_read" on public.vocabulary_words
  for select using (true);
create policy "grammar_topics_public_read" on public.grammar_topics
  for select using (true);
create policy "grammar_lessons_public_read" on public.grammar_lessons
  for select using (true);
create policy "dictionary_entries_public_read" on public.dictionary_entries
  for select using (true);
create policy "score_conversion_tables_public_read" on public.score_conversion_tables
  for select using (is_active = true or public.is_admin());
