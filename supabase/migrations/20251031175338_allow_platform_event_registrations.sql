/*
  # Allow Platform Event Registrations

  1. Changes
    - Make organizer_id nullable in events table (to support platform events)
    - Add platform_event_id column to event_registrations
    - Update constraints to allow registration for either events or platform_events
    - Add check constraint to ensure one of the two is filled

  2. Security
    - Maintain existing RLS policies
    - Add policies for platform event registrations
*/

-- Make organizer_id nullable in events for platform events
ALTER TABLE public.events
ALTER COLUMN organizer_id DROP NOT NULL;

-- Add platform_event_id to event_registrations
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS platform_event_id uuid REFERENCES public.platform_events(id) ON DELETE CASCADE;

-- Add check to ensure either event_id or platform_event_id is set (but not both)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'event_registrations_event_xor_platform_event'
  ) THEN
    ALTER TABLE public.event_registrations
    ADD CONSTRAINT event_registrations_event_xor_platform_event
    CHECK (
      (event_id IS NOT NULL AND platform_event_id IS NULL) OR
      (event_id IS NULL AND platform_event_id IS NOT NULL)
    );
  END IF;
END $$;

-- Update unique constraint to include platform_event_id
DO $$
BEGIN
  -- Drop old unique constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'event_registrations_event_id_user_id_key'
  ) THEN
    ALTER TABLE public.event_registrations
    DROP CONSTRAINT event_registrations_event_id_user_id_key;
  END IF;
  
  -- Create new unique index that handles both cases
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'event_registrations_unique_user_per_event'
  ) THEN
    CREATE UNIQUE INDEX event_registrations_unique_user_per_event
    ON public.event_registrations (user_id, COALESCE(event_id, platform_event_id));
  END IF;
END $$;

-- Add RLS policy for platform event registrations
CREATE POLICY IF NOT EXISTS "Users can view registrations for platform events"
  ON public.event_registrations
  FOR SELECT
  USING (
    platform_event_id IS NOT NULL
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_event_registrations_platform_event_id
  ON public.event_registrations(platform_event_id);

COMMENT ON COLUMN public.event_registrations.platform_event_id IS 'ID of platform event (mutually exclusive with event_id)';
