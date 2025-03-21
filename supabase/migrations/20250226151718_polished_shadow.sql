/*
  # Fix RLS Policies for User Data Access

  1. Changes
    - Update RLS policies for profiles table to allow proper creation and updates
    - Add missing RLS policies for settings table
    - Add storage bucket policies for certificate files

  2. Security
    - Ensure users can only access their own data
    - Allow authenticated users to create their initial profile
    - Allow authenticated users to manage their settings
    - Allow authenticated users to upload and access certificate files
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

-- Profiles table policies
CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Settings table policies
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can update own settings" ON settings;
DROP POLICY IF EXISTS "Users can create own settings" ON settings;

CREATE POLICY "Users can create own settings"
  ON settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for certificates if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name)
  VALUES ('certificates', 'certificates')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Storage policies for certificate files
DROP POLICY IF EXISTS "Users can upload own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own certificates" ON storage.objects;

CREATE POLICY "Users can upload own certificates"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certificates' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own certificates"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificates' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own certificates"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certificates' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );