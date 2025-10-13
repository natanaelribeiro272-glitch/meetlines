-- Add story privacy settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS story_visible_to text DEFAULT 'both' CHECK (story_visible_to IN ('both', 'friends_only', 'nearby_only'));