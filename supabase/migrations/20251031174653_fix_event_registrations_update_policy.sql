/*
  # Fix Event Registrations Update Policy

  1. Security Changes
    - Add UPDATE policy for event_registrations table
    - Allow users to update their own registrations (including attendance confirmation)
    - Maintain data integrity by ensuring users can only update their own records
*/

-- Add policy for users to update their own registrations
CREATE POLICY "Users can update their own registrations"
  ON public.event_registrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
