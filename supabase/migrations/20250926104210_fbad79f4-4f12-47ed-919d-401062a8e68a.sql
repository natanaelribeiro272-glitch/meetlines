-- Corrigir search_path das funções para resolver warnings de segurança
CREATE OR REPLACE FUNCTION update_organizer_stats(org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir ou atualizar estatísticas do organizador
  INSERT INTO public.organizer_stats (
    organizer_id,
    events_count
  )
  VALUES (
    org_id,
    (SELECT COUNT(*) FROM events WHERE organizer_id = org_id)
  )
  ON CONFLICT (organizer_id) 
  DO UPDATE SET 
    events_count = (SELECT COUNT(*) FROM events WHERE organizer_id = org_id),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION handle_event_stats_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar stats do organizador
  PERFORM update_organizer_stats(COALESCE(NEW.organizer_id, OLD.organizer_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;