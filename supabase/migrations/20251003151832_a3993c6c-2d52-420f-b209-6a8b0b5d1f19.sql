-- Update function to sync both avatar and display_name to organizer table
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
    page_title = COALESCE(NEW.display_name, page_title),
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;