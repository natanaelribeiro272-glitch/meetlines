/*
  # Add public access to cities table
  
  1. Changes
    - Add policy to allow anonymous (non-authenticated) users to read cities
    - This is needed for the onboarding flow where users aren't logged in yet
  
  2. Security
    - Read-only access for anonymous users
    - Insert remains restricted to authenticated users only
*/

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Anyone can read cities" ON cities;

-- Allow both authenticated and anonymous users to read cities
CREATE POLICY "Anyone can read cities"
  ON cities
  FOR SELECT
  USING (true);
