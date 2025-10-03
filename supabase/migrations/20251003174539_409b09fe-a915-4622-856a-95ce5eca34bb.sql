-- Add username field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Add trigger to prevent username changes after being set
CREATE OR REPLACE FUNCTION public.prevent_username_change_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Allow setting username on insert
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Prevent changing username on update
  IF TG_OP = 'UPDATE' AND OLD.username IS DISTINCT FROM NEW.username THEN
    RAISE EXCEPTION 'Username cannot be changed once set';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_username_change_profiles_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_username_change_profiles();