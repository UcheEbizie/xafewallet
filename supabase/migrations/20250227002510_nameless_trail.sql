/*
  # Fix storage permissions for certificates

  1. Changes
    - Update storage bucket policies to allow authenticated users to upload files
    - Fix the path check in the storage policies to properly handle user uploads
  
  2. Security
    - Maintain row-level security while fixing permission issues
    - Ensure users can only access their own files
*/

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own certificates" ON storage.objects;

-- Create improved storage policies with fixed path checks
CREATE POLICY "Users can upload own certificates"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certificates' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own certificates"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificates' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own certificates"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certificates' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Ensure the certificates bucket exists
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('certificates', 'certificates', false)
  ON CONFLICT (id) DO NOTHING;
END $$;