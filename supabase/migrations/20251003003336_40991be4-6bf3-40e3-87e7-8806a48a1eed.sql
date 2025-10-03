-- Add avatar_url column to organizers table
ALTER TABLE public.organizers
ADD COLUMN IF NOT EXISTS avatar_url text;