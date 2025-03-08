/*
  # Fix Database Issues for User Data Management

  1. Changes
    - Add ON CONFLICT handling for profiles and settings
    - Add default values for required fields
    - Add triggers for automatic user data creation
    - Update RLS policies to allow proper data access

  2. Security
    - Maintain RLS policies for data protection
    - Ensure users can only access their own data
*/

-- Add ON CONFLICT handling for profiles
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

ALTER TABLE profiles
ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- Add ON CONFLICT handling for settings
ALTER TABLE settings
DROP CONSTRAINT IF EXISTS settings_user_id_key CASCADE;

ALTER TABLE settings
ADD CONSTRAINT settings_user_id_key UNIQUE (user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create default profile
  INSERT INTO public.profiles (id, name, position)
  VALUES (new.id, 'New User', 'Position')
  ON CONFLICT (id) DO NOTHING;

  -- Create default settings
  INSERT INTO public.settings (user_id, email_notifications, push_notifications, expiry_reminders_days, auto_renewal_reminders)
  VALUES (new.id, true, true, 30, true)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

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
  USING (auth.uid() = id);

-- Update RLS policies for settings
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
  USING (auth.uid() = user_id);