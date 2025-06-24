-- Create kyc-documents bucket if it doesn't exist
insert into storage.buckets (id, name)
values ('kyc-documents', 'kyc-documents')
on conflict (id) do nothing;

-- Allow public read access to approved KYC documents
create policy "Public Access"
on storage.objects for select
using (
  bucket_id = 'kyc-documents' and
  exists (
    select 1 from auth.users
    where auth.users.id = auth.uid()
    and (auth.users.raw_app_meta_data->>'role')::text = 'admin'
  )
);

-- Allow users to upload their own KYC documents
create policy "Users can upload their own KYC documents"
on storage.objects for insert
with check (
  bucket_id = 'kyc-documents' and
  (storage.foldername(name))[1] = auth.uid()
);

-- Allow users to read their own KYC documents
create policy "Users can read their own KYC documents"
on storage.objects for select
using (
  bucket_id = 'kyc-documents' and
  (storage.foldername(name))[1] = auth.uid()
);
