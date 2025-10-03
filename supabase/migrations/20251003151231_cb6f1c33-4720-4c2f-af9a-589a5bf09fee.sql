-- Add category column to events table
ALTER TABLE public.events 
ADD COLUMN category text;