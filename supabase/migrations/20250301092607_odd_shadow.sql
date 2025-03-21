-- Create access_logs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'access_logs'
  ) THEN
    CREATE TABLE access_logs (
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
  END IF;
END $$;

-- Only create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'access_logs' AND policyname = 'Users can create access logs'
  ) THEN
    ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can create access logs"
      ON access_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'access_logs' AND policyname = 'Users can view their own access logs'
  ) THEN
    CREATE POLICY "Users can view their own access logs"
      ON access_logs
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid() OR certificate_id IN (
        SELECT id FROM certificates WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'certificates' AND policyname = 'Anonymous users can view shared certificates'
  ) THEN
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
  END IF;
END $$;

-- Create policy for public access to link_shares
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'link_shares' AND policyname = 'Anonymous users can view active link shares'
  ) THEN
    CREATE POLICY "Anonymous users can view active link shares"
      ON link_shares
      FOR SELECT
      TO anon
      USING (
        is_revoked = false 
        AND (expires_at IS NULL OR expires_at > now())
        AND (max_downloads IS NULL OR download_count < max_downloads)
      );
  END IF;
END $$;