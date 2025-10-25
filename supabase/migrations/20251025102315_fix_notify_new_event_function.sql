/*
  # Corrigir Função notify_new_event

  1. Problema
    - A função notify_new_event() está tentando acessar NEW.is_published
    - A coluna is_published não existe na tabela events
    - Isso causa erro ao criar eventos: "record new has no field is_published"

  2. Solução
    - Remover verificação de is_published
    - Remover verificação de status = 'approved' (eventos não têm esse status)
    - Simplificar para notificar sempre que um evento for criado
    - Eventos criados por organizadores já são válidos por padrão

  3. Segurança
    - Mantém notificação de seguidores
    - Mantém envio de push notifications
    - Remove lógica de aprovação que não se aplica a eventos de organizadores
*/

-- Recriar função sem is_published
CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_follower record;
  v_organizer_name text;
BEGIN
  -- Buscar nome do organizador
  SELECT page_title INTO v_organizer_name
  FROM organizers
  WHERE id = NEW.organizer_id;

  -- Notificar todos os seguidores
  FOR v_follower IN
    SELECT user_id FROM followers WHERE organizer_id = NEW.organizer_id
  LOOP
    -- Criar notificação
    INSERT INTO notifications (user_id, from_user_id, organizer_id, event_id, type, title, message)
    VALUES (
      v_follower.user_id,
      NULL,
      NEW.organizer_id,
      NEW.id,
      'event_created',
      'Novo evento!',
      COALESCE(v_organizer_name, 'Um organizador') || ' criou: ' || NEW.title
    );

    -- Enviar push notification
    PERFORM send_push_notification_async(
      v_follower.user_id,
      'Novo evento disponível!',
      NEW.title || ' - ' || COALESCE(v_organizer_name, 'Novo evento'),
      jsonb_build_object(
        'type', 'event_created',
        'event_id', NEW.id,
        'organizer_id', NEW.organizer_id
      )
    );
  END LOOP;

  RETURN NEW;
END;
$function$;
