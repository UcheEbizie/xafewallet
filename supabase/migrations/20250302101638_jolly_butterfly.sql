/*
  # Fix Access Logs RLS Policy

  1. Changes
     - Modify access_logs table to allow anonymous users to insert records
     - Create a new policy specifically for anonymous users
     - Update existing policies to ensure proper access control
  
  2. Security
     - Maintain row level security while allowing anonymous access for tracking
*/

-- Drop existing policies for access_logs
DROP POLICY IF EXISTS "Users can create access logs" ON access_logs;
DROP POLICY IF EXISTS "Users can view their own access logs" ON access_logs;
DROP POLICY IF EXISTS "Anonymous users can create access logs" ON access_logs;

-- Create new policies with proper permissions
CREATE POLICY "Anyone can insert access logs"
  ON access_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own access logs"
  ON access_logs
  FOR SELECT
  TO authenticated
  USING (
    certificate_id IN (
      SELECT id FROM certificates WHERE user_id = auth.uid()
    )
  );

-- Ensure anonymous users can access the necessary tables
GRANT SELECT ON link_shares TO anon;
GRANT SELECT ON certificates TO anon;
GRANT SELECT ON profiles TO anon;
GRANT INSERT ON access_logs TO anon;

-- Note: Removed the GRANT USAGE ON SEQUENCE access_logs_id_seq TO anon;
-- because the access_logs table uses UUID primary keys, not a sequence