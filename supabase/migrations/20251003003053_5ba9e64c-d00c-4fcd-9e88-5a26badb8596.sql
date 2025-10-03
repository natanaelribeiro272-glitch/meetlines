-- Add requires_registration column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS requires_registration boolean DEFAULT false;