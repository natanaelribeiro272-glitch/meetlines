-- Add find_friends_visible field to profiles table
ALTER TABLE public.profiles
ADD COLUMN find_friends_visible boolean DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN public.profiles.find_friends_visible IS 'Controls if user wants to be visible in Find Friends feature during live events';