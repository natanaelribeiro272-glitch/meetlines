-- Atualizar trigger para permitir definir username pela primeira vez (quando é NULL)
DROP TRIGGER IF EXISTS prevent_username_change_profiles_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_username_change_profiles();

CREATE OR REPLACE FUNCTION public.prevent_username_change_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permitir INSERT
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Permitir definir username pela primeira vez (quando OLD.username é NULL)
  IF TG_OP = 'UPDATE' AND OLD.username IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Impedir mudança de username quando já está definido
  IF TG_OP = 'UPDATE' AND OLD.username IS NOT NULL AND OLD.username IS DISTINCT FROM NEW.username THEN
    RAISE EXCEPTION 'Username cannot be changed once set';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_username_change_profiles_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_username_change_profiles();