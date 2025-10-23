/*
  # Add has_platform_tickets column to events table
  
  1. Changes
    - Add `has_platform_tickets` column to events table
    - This boolean flag indicates if the event sells tickets directly through the platform
    - Defaults to false for existing events
  
  2. Purpose
    - Enable filtering and display logic for events with platform-managed ticket sales
    - Distinguish between free events, external ticket links, and platform ticket sales
*/

-- Add has_platform_tickets column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'has_platform_tickets'
  ) THEN
    ALTER TABLE public.events ADD COLUMN has_platform_tickets BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index for faster queries filtering by platform tickets
CREATE INDEX IF NOT EXISTS idx_events_has_platform_tickets ON public.events(has_platform_tickets);

-- Add comment explaining the field
COMMENT ON COLUMN public.events.has_platform_tickets IS 'Indicates if event sells tickets directly through the platform with Stripe integration';
