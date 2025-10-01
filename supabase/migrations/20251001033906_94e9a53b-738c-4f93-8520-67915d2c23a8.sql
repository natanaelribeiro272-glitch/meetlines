-- Add interests field to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS interests TEXT[];

-- Add index for better performance on interests queries
CREATE INDEX IF NOT EXISTS idx_events_interests ON public.events USING GIN(interests);