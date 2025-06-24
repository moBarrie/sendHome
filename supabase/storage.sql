-- Create the storage bucket for KYC documents
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', true);

-- Allow authenticated users to upload their own KYC documents
create policy "Users can upload their own KYC documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'kyc-documents' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own KYC documents
create policy "Users can view their own KYC documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'kyc-documents' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow admin users to view all KYC documents
create policy "Admins can view all KYC documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'kyc-documents' AND
  auth.uid() in (
    select au.id
    from auth.users au
    join profiles p on au.id = p.id
    where p.is_admin = true
  )
);
