/*
  # Enhanced sharing features and access tracking

  1. Changes
    - Add columns to `link_shares`:
      - `view_count` (integer)
    - Add columns to `email_shares`:
      - `open_count` (integer)
      - `click_count` (integer)
  
  2. Security
    - Create additional policies for anonymous access
    - Add indexes for better performance
    - Create functions for tracking and status updates
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

-- Create anonymous access policy for storage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Anonymous users can view shared certificates'
  ) THEN
    CREATE POLICY "Anonymous users can view shared certificates"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (
        bucket_id = 'certificates' AND
        name IN (
          SELECT file_url FROM certificates WHERE id IN (
            SELECT unnest(certificate_ids)::uuid FROM link_shares 
            WHERE is_revoked = false 
            AND (expires_at IS NULL OR expires_at > now())
            AND (max_downloads IS NULL OR download_count < max_downloads)
          )
        )
      );
  END IF;
END
$$;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_link_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE link_shares
  SET view_count = view_count + 1
  WHERE id = NEW.share_id::uuid AND NEW.access_type = 'view';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for view count
DROP TRIGGER IF EXISTS on_access_log_insert ON access_logs;

CREATE TRIGGER on_access_log_insert
  AFTER INSERT ON access_logs
  FOR EACH ROW
  WHEN (NEW.access_method = 'link')
  EXECUTE FUNCTION increment_link_view_count();

-- Create function to check certificate expiry
CREATE OR REPLACE FUNCTION update_certificate_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If no expiry date, status remains 'valid'
  IF NEW.expiry_date IS NULL THEN
    NEW.status := 'valid';
    RETURN NEW;
  END IF;
  
  -- Check if expired
  IF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  -- Check if expiring within 30 days
  ELSIF NEW.expiry_date < (CURRENT_DATE + INTERVAL '30 days') THEN
    NEW.status := 'expiring';
  ELSE
    NEW.status := 'valid';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for certificate status
DROP TRIGGER IF EXISTS before_certificate_insert_update ON certificates;

CREATE TRIGGER before_certificate_insert_update
  BEFORE INSERT OR UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_status();