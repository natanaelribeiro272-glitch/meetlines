-- Remove trigger that prevents username changes for organizers
DROP TRIGGER IF EXISTS enforce_username_immutability ON public.organizers;
DROP FUNCTION IF EXISTS public.prevent_username_change();

-- Add a function to validate username uniqueness
CREATE OR REPLACE FUNCTION public.check_username_available(username_to_check text, current_organizer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.organizers 
    WHERE username = username_to_check 
    AND id != current_organizer_id
  );
END;
$$;