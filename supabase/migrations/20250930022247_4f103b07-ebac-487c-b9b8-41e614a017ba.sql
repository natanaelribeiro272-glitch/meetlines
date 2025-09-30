-- Add session_name column to organizer_photos table
ALTER TABLE public.organizer_photos
ADD COLUMN IF NOT EXISTS session_name TEXT;