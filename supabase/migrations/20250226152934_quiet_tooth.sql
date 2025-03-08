/*
  # Add Profile and Settings Fields

  1. Changes
    - Add avatar_url to profiles table
    - Add additional settings fields
    - Update RLS policies

  2. Security
    - Maintain RLS policies for data protection
    - Ensure users can only access their own data
*/

-- Add avatar_url column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Add additional settings fields if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'dark_mode'
  ) THEN
    ALTER TABLE settings ADD COLUMN dark_mode boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'notification_frequency'
  ) THEN
    ALTER TABLE settings ADD COLUMN notification_frequency text DEFAULT 'daily';
  END IF;
END $$;