-- Storage buckets used by the app. Run once in the Supabase SQL editor
-- (or create the buckets from Dashboard > Storage and skip the inserts).

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('question-media', 'question-media', true)
on conflict (id) do nothing;

-- question-media holds admin-uploaded audio for Part 1-4 listening questions
-- and images for questions/test thumbnails — 50MB covers a multi-minute
-- conversation/talk clip at a reasonable bitrate, or a large scanned image,
-- with headroom.
update storage.buckets
set file_size_limit = 52428800, -- 50MB
    allowed_mime_types = array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'image/png', 'image/jpeg', 'image/webp']
where id = 'question-media';

-- avatars: any authenticated user may upload/update only inside their own
-- "<user id>/..." folder; anyone can read (public profile pictures).
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_owner_write" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_update" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- question-media: admin content (question images, audio for Part 1-4,
-- passage assets). Public read, write restricted to admins.
create policy "question_media_public_read" on storage.objects
  for select using (bucket_id = 'question-media');

create policy "question_media_admin_write" on storage.objects
  for insert with check (bucket_id = 'question-media' and public.is_admin());

create policy "question_media_admin_update" on storage.objects
  for update using (bucket_id = 'question-media' and public.is_admin());

create policy "question_media_admin_delete" on storage.objects
  for delete using (bucket_id = 'question-media' and public.is_admin());
