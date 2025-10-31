/*
  # Fix event_id to be nullable

  1. Changes
    - Make event_id nullable in event_registrations to support platform events
    - This allows registrations to have either event_id or platform_event_id

  2. Security
    - Maintains all existing RLS policies
    - The XOR constraint ensures one of the two IDs is always present
*/

-- Make event_id nullable to support platform events
ALTER TABLE public.event_registrations
ALTER COLUMN event_id DROP NOT NULL;

COMMENT ON COLUMN public.event_registrations.event_id IS 'ID of regular event (mutually exclusive with platform_event_id)';