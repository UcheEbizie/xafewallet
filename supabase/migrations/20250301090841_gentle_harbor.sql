/*
  # Additional sharing features and policies

  1. Changes
    - Add columns to `link_shares`:
      - `view_count` (integer)
    - Add columns to `email_shares`:
      - `open_count` (integer)
      - `click_count` (integer)
  
  2. Security
    - Create additional policies for anonymous access
    - Add indexes for better performance
*/

-- Add columns to link_shares if they don't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'link_shares' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE link_shares ADD COLUMN view_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_shares' AND column_name = 'open_count'
  ) THEN
    ALTER TABLE email_shares ADD COLUMN open_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_shares' AND column_name = 'click_count'
  ) THEN
    ALTER TABLE email_shares ADD COLUMN click_count integer DEFAULT 0;
  END IF;
END
$$;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS certificates_user_id_idx ON certificates(user_id);
CREATE INDEX IF NOT EXISTS certificates_expiry_date_idx ON certificates(expiry_date);
CREATE INDEX IF NOT EXISTS email_shares_tracking_id_idx ON email_shares(tracking_id);

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'access_logs' AND policyname = 'Users can create access logs'
  ) THEN
    DROP POLICY "Users can create access logs" ON access_logs;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'access_logs' AND policyname = 'Users can view their own access logs'
  ) THEN
    DROP POLICY "Users can view their own access logs" ON access_logs;
  END IF;
END
$$;

-- Recreate policies for access_logs
CREATE POLICY "Users can create access logs"
  ON access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own access logs"
  ON access_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR certificate_id IN (
    SELECT id FROM certificates WHERE user_id = auth.uid()
  ));