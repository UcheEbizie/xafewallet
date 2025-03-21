/*
  # Email sharing system

  1. New Tables
    - `email_shares`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `recipients` (text array)
      - `subject` (text)
      - `message` (text)
      - `certificate_ids` (text array)
      - `sent_at` (timestamptz)
      - `status` (text)
    - `link_shares`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `url` (text)
      - `certificate_ids` (text array)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `is_password_protected` (boolean)
      - `is_revoked` (boolean)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own shares
*/

-- Email shares table
CREATE TABLE IF NOT EXISTS email_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  recipients text[] NOT NULL,
  subject text NOT NULL,
  message text,
  certificate_ids text[] NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_shares ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_shares' AND policyname = 'Users can create their own email shares'
  ) THEN
    CREATE POLICY "Users can create their own email shares"
      ON email_shares
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_shares' AND policyname = 'Users can view their own email shares'
  ) THEN
    CREATE POLICY "Users can view their own email shares"
      ON email_shares
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Link shares table
CREATE TABLE IF NOT EXISTS link_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  certificate_ids text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_password_protected boolean DEFAULT false,
  is_revoked boolean DEFAULT false
);

ALTER TABLE link_shares ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'link_shares' AND policyname = 'Users can create their own link shares'
  ) THEN
    CREATE POLICY "Users can create their own link shares"
      ON link_shares
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'link_shares' AND policyname = 'Users can view their own link shares'
  ) THEN
    CREATE POLICY "Users can view their own link shares"
      ON link_shares
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'link_shares' AND policyname = 'Users can update their own link shares'
  ) THEN
    CREATE POLICY "Users can update their own link shares"
      ON link_shares
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS email_shares_user_id_idx ON email_shares(user_id);
CREATE INDEX IF NOT EXISTS link_shares_user_id_idx ON link_shares(user_id);