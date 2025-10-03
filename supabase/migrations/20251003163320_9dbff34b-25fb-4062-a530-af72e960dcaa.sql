-- Rename slug column to username for clarity
ALTER TABLE public.organizers 
  RENAME COLUMN slug TO username;

-- Add a constraint to ensure username follows Instagram-like format
-- Only lowercase letters, numbers, dots, and underscores
ALTER TABLE public.organizers 
  ADD CONSTRAINT username_format 
  CHECK (username ~ '^[a-z0-9._]+$' AND length(username) >= 3 AND length(username) <= 30);

-- Add comment to document that username is immutable
COMMENT ON COLUMN public.organizers.username IS 
  'Unique username (like Instagram @handle). Cannot be changed after creation. Used in public URLs.';

-- Create a trigger to prevent username changes after creation
CREATE OR REPLACE FUNCTION public.prevent_username_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE TRIGGER enforce_username_immutability
  BEFORE INSERT OR UPDATE ON public.organizers
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_username_change();