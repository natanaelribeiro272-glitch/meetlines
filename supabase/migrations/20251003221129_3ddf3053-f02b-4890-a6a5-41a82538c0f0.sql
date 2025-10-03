-- Add ticket_link column to events table for paid events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS ticket_link TEXT;

COMMENT ON COLUMN public.events.ticket_link IS 'URL for purchasing event tickets (only for paid events)';