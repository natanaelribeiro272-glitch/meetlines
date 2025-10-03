-- Function to sync profile changes to organizer table
CREATE OR REPLACE FUNCTION public.sync_profile_to_organizer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update organizer table when profile is updated
  UPDATE public.organizers
  SET 
    avatar_url = NEW.avatar_url,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync profile updates to organizer
DROP TRIGGER IF EXISTS sync_profile_to_organizer_trigger ON public.profiles;
CREATE TRIGGER sync_profile_to_organizer_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_organizer();