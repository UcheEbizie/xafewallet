/*
  # Fix Authentication System

  1. Add anonymous access policy for auth_logs
  2. Create storage bucket for profiles
  3. Add storage policies for profile avatars
  4. Fix RLS policies for auth tables
*/

-- Enable anonymous access to auth_logs for sign-up and sign-in
DROP POLICY IF EXISTS "Anonymous users can insert auth logs" ON auth_logs;

CREATE POLICY "Anonymous users can insert auth logs"
  ON auth_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create storage bucket for profiles if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profiles', 'profiles', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Storage policies for profile avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own avatar"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Fix auth_logs policies to ensure anonymous users can insert
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Ensure auth_logs can be accessed by anon
GRANT INSERT ON auth_logs TO anon;
GRANT INSERT ON auth_logs TO authenticated;
GRANT SELECT ON auth_logs TO authenticated;

-- Fix user_sessions policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Fix security_settings policies
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Create public policy for profiles to allow anonymous access to shared profiles
CREATE POLICY "Anonymous users can view shared profiles"
  ON profiles
  FOR SELECT
  TO anon
  USING (id IN (
    SELECT user_id FROM link_shares 
    WHERE is_revoked = false 
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_downloads IS NULL OR download_count < max_downloads)
  ));