-- Função para atualizar a contagem de seguidores
CREATE OR REPLACE FUNCTION public.update_followers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Determinar o organizer_id baseado na operação
  IF TG_OP = 'DELETE' THEN
    org_id := OLD.organizer_id;
  ELSE
    org_id := NEW.organizer_id;
  END IF;

  -- Atualizar ou inserir a contagem de seguidores
  INSERT INTO public.organizer_stats (organizer_id, followers_count)
  VALUES (
    org_id,
    (SELECT COUNT(*) FROM public.followers WHERE organizer_id = org_id)
  )
  ON CONFLICT (organizer_id) 
  DO UPDATE SET 
    followers_count = (SELECT COUNT(*) FROM public.followers WHERE organizer_id = org_id),
    updated_at = now();

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Criar trigger para INSERT
CREATE TRIGGER update_followers_count_on_insert
AFTER INSERT ON public.followers
FOR EACH ROW
EXECUTE FUNCTION public.update_followers_count();

-- Criar trigger para DELETE
CREATE TRIGGER update_followers_count_on_delete
AFTER DELETE ON public.followers
FOR EACH ROW
EXECUTE FUNCTION public.update_followers_count();