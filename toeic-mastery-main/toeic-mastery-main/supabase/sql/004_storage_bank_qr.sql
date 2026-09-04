-- Bucket for affiliate withdrawal bank QR codes, uploaded once by each user
-- from /account/commissions. Run once in the Supabase SQL editor (or create
-- the bucket from Dashboard > Storage and skip the insert) — same pattern
-- as the "avatars" bucket in 003_storage.sql.

insert into storage.buckets (id, name, public)
values ('bank-qr', 'bank-qr', true)
on conflict (id) do nothing;

update storage.buckets
set file_size_limit = 5242880, -- 5MB
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'bank-qr';

-- bank-qr: any authenticated user may upload/update only inside their own
-- "<user id>/..." folder; anyone can read (needed to render the QR back to
-- the user and to admins reviewing withdrawal requests).
create policy "bank_qr_public_read" on storage.objects
  for select using (bucket_id = 'bank-qr');

create policy "bank_qr_owner_write" on storage.objects
  for insert with check (bucket_id = 'bank-qr' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "bank_qr_owner_update" on storage.objects
  for update using (bucket_id = 'bank-qr' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "bank_qr_owner_delete" on storage.objects
  for delete using (bucket_id = 'bank-qr' and (storage.foldername(name))[1] = auth.uid()::text);
