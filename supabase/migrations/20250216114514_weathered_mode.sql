/*
  # Initial Schema Setup for XafeWallet

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `position` (text)
      - `avatar_url` (text)
      - `updated_at` (timestamp)
    
    - `certificates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `type` (text)
      - `expiry_date` (date)
      - `completion_date` (date)
      - `status` (text)
      - `issuer` (text)
      - `cert_number` (text)
      - `description` (text)
      - `file_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `email_notifications` (boolean)
      - `push_notifications` (boolean)
      - `expiry_reminders_days` (integer)
      - `auto_renewal_reminders` (boolean)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  position text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  expiry_date date,
  completion_date date,
  status text NOT NULL,
  issuer text,
  cert_number text,
  description text,
  file_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
  ON certificates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own certificates"
  ON certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own certificates"
  ON certificates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own certificates"
  ON certificates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  expiry_reminders_days integer DEFAULT 30,
  auto_renewal_reminders boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();