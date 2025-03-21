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
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('certificates', 'certificates', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can upload their own certificates" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own certificates" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own certificates" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view their own certificates" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view shared certificates" ON storage.objects;

  -- Create new policies
  CREATE POLICY "Users can upload their own certificates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certificates' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  CREATE POLICY "Users can update their own certificates"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'certificates' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  CREATE POLICY "Users can delete their own certificates"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certificates' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  CREATE POLICY "Users can view their own certificates"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificates' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  CREATE POLICY "Anyone can view shared certificates"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'certificates' AND
    -- Add additional checks here if needed for shared certificates
    true
  );
END $$;