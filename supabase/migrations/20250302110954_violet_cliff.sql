/*
  # Add gen_random_uuid RPC Function

  1. New Functions
     - Create a database function to generate UUIDs that can be called from the client
  
  2. Security
     - Function is accessible to anonymous users for access logging
*/

-- Create a function to generate UUIDs that can be called via RPC
CREATE OR REPLACE FUNCTION gen_random_uuid()
RETURNS uuid AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION gen_random_uuid TO anon;
GRANT EXECUTE ON FUNCTION gen_random_uuid TO authenticated;