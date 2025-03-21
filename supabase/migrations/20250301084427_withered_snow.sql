/*
  # Access Logs and Enhanced Sharing

  1. New Tables
    - `access_logs`
      - `id` (uuid, primary key)
      - `certificate_id` (uuid, references certificates)
      - `user_id` (uuid, references profiles)
      - `access_type` (text: 'view', 'download', 'email')
      - `access_method` (text: 'link', 'email', 'direct')
      - `ip_address` (text)
      - `user_agent` (text)
      - `recipient_email` (text)
      - `share_id` (text)
      - `timestamp` (timestamptz)

  2. Changes to Existing Tables
    - Add to `link_shares`:
      - `token` (text)
      - `password_hash` (text)
      - `max_downloads` (integer)
      - `download_count` (integer)
    - Add to `email_shares`:
      - `tracking_id` (text)

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create access_logs table
CREATE TABLE IF NOT EXISTS access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid REFERENCES certificates(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  access_type text NOT NULL,
  access_method text NOT NULL,
  ip_address text,
  user_agent text,
  recipient_email text,
  share_id text,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for access_logs
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

-- Add columns to link_shares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'link_shares' AND column_name = 'token'
  ) THEN
    ALTER TABLE link_shares ADD COLUMN token text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'link_shares' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE link_shares ADD COLUMN password_hash text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'link_shares' AND column_name = 'max_downloads'
  ) THEN
    ALTER TABLE link_shares ADD COLUMN max_downloads integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'link_shares' AND column_name = 'download_count'
  ) THEN
    ALTER TABLE link_shares ADD COLUMN download_count integer DEFAULT 0;
  END IF;
END $$;

-- Add tracking_id to email_shares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_shares' AND column_name = 'tracking_id'
  ) THEN
    ALTER TABLE email_shares ADD COLUMN tracking_id text;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS access_logs_certificate_id_idx ON access_logs(certificate_id);
CREATE INDEX IF NOT EXISTS access_logs_timestamp_idx ON access_logs(timestamp);
CREATE INDEX IF NOT EXISTS link_shares_token_idx ON link_shares(token);

-- Create anonymous access policy for public certificate viewing
CREATE POLICY "Anonymous users can view shared certificates"
  ON certificates
  FOR SELECT
  TO anon
  USING (id IN (
    SELECT unnest(certificate_ids)::uuid FROM link_shares 
    WHERE is_revoked = false 
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_downloads IS NULL OR download_count < max_downloads)
  ));

-- Create policy for public access to link_shares
CREATE POLICY "Anonymous users can view active link shares"
  ON link_shares
  FOR SELECT
  TO anon
  USING (
    is_revoked = false 
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_downloads IS NULL OR download_count < max_downloads)
  );