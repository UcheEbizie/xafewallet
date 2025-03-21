/*
  # Authentication System Tables

  1. New Tables
    - `auth_logs` - Stores authentication events for audit purposes
    - `user_sessions` - Tracks active user sessions
    - `security_settings` - Stores user-specific security settings

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Add indexes for performance
*/

-- Auth logs table for audit trail
CREATE TABLE IF NOT EXISTS auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  success boolean NOT NULL,
  error_message text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS on auth_logs
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting auth logs (allow all authenticated users)
CREATE POLICY "Anyone can insert auth logs"
  ON auth_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for viewing auth logs (only admins and the user themselves)
CREATE POLICY "Users can view their own auth logs"
  ON auth_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR 
         auth.uid() IN (SELECT id FROM auth.users WHERE is_super_admin = true));

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  is_active boolean DEFAULT true
);

-- Enable RLS on user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing sessions
CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for inserting sessions
CREATE POLICY "Users can create their own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for updating sessions
CREATE POLICY "Users can update their own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for deleting sessions
CREATE POLICY "Users can delete their own sessions"
  ON user_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Security settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  two_factor_enabled boolean DEFAULT false,
  two_factor_method text,
  login_notifications boolean DEFAULT true,
  suspicious_activity_notifications boolean DEFAULT true,
  allowed_ips text[],
  max_sessions integer DEFAULT 5,
  session_timeout_minutes integer DEFAULT 60,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on security_settings
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing security settings
CREATE POLICY "Users can view their own security settings"
  ON security_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for inserting security settings
CREATE POLICY "Users can create their own security settings"
  ON security_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for updating security settings
CREATE POLICY "Users can update their own security settings"
  ON security_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS auth_logs_user_id_idx ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS auth_logs_timestamp_idx ON auth_logs(timestamp);
CREATE INDEX IF NOT EXISTS auth_logs_event_type_idx ON auth_logs(event_type);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS user_sessions_session_token_idx ON user_sessions(session_token);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_security()
RETURNS trigger AS $$
BEGIN
  -- Create default security settings
  INSERT INTO public.security_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created_security ON auth.users;

CREATE TRIGGER on_auth_user_created_security
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_security();

-- Create function to update session activity
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS trigger AS $$
BEGIN
  NEW.last_active_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session activity
CREATE TRIGGER update_session_last_active
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_activity();

-- Create function to update security settings timestamp
CREATE OR REPLACE FUNCTION public.update_security_settings_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for security settings timestamp
CREATE TRIGGER update_security_settings_timestamp
  BEFORE UPDATE ON security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_security_settings_timestamp();