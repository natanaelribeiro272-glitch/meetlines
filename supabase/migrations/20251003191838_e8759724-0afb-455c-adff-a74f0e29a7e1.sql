-- Add notes_visible field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN notes_visible boolean DEFAULT true;