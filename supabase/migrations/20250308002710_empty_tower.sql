/*
  # Create Storage Bucket for Certificates

  1. New Storage Bucket
    - Creates a public bucket named "certificates" for storing certificate files
    - Enables RLS policies for secure access
  
  2. Security
    - Adds RLS policies for authenticated users to:
      - Upload their own certificates
      - Read their own certificates
      - Delete their own certificates
    - Allows anonymous users to read shared certificates
*/

-- Create the certificates bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Create policies
create policy "Users can upload their own certificates"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'certificates' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own certificates"
on storage.objects for update
to authenticated
using (
  bucket_id = 'certificates' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own certificates"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'certificates' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their own certificates"
on storage.objects for select
to authenticated
using (
  bucket_id = 'certificates' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Anyone can view shared certificates"
on storage.objects for select
to anon
using (
  bucket_id = 'certificates' and
  -- Add additional checks here if needed for shared certificates
  true
);