-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('event_created', 'event_updated', 'event_cancelled')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários podem ver suas próprias notificações
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Políticas: usuários podem marcar suas notificações como lidas
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Políticas: usuários podem deletar suas notificações
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Função para notificar seguidores quando um evento é criado
CREATE OR REPLACE FUNCTION public.notify_followers_on_event_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_record RECORD;
  organizer_name TEXT;
  event_title TEXT;
BEGIN
  -- Buscar nome do organizador e título do evento
  SELECT page_title INTO organizer_name FROM organizers WHERE id = NEW.organizer_id;
  event_title := NEW.title;
  
  -- Criar notificação para cada seguidor
  FOR follower_record IN 
    SELECT user_id FROM followers WHERE organizer_id = NEW.organizer_id
  LOOP
    INSERT INTO notifications (user_id, organizer_id, event_id, type, title, message)
    VALUES (
      follower_record.user_id,
      NEW.organizer_id,
      NEW.id,
      'event_created',
      'Novo evento criado!',
      organizer_name || ' criou o evento "' || event_title || '"'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Função para notificar seguidores quando um evento é atualizado
CREATE OR REPLACE FUNCTION public.notify_followers_on_event_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_record RECORD;
  organizer_name TEXT;
  event_title TEXT;
BEGIN
  -- Apenas notificar se houver mudanças significativas
  IF (OLD.title IS DISTINCT FROM NEW.title) OR 
     (OLD.event_date IS DISTINCT FROM NEW.event_date) OR 
     (OLD.location IS DISTINCT FROM NEW.location) THEN
    
    -- Buscar nome do organizador e título do evento
    SELECT page_title INTO organizer_name FROM organizers WHERE id = NEW.organizer_id;
    event_title := NEW.title;
    
    -- Criar notificação para cada seguidor
    FOR follower_record IN 
      SELECT user_id FROM followers WHERE organizer_id = NEW.organizer_id
    LOOP
      INSERT INTO notifications (user_id, organizer_id, event_id, type, title, message)
      VALUES (
        follower_record.user_id,
        NEW.organizer_id,
        NEW.id,
        'event_updated',
        'Evento atualizado!',
        organizer_name || ' atualizou o evento "' || event_title || '"'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função para notificar seguidores quando um evento é cancelado
CREATE OR REPLACE FUNCTION public.notify_followers_on_event_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_record RECORD;
  organizer_name TEXT;
  event_title TEXT;
BEGIN
  -- Notificar apenas se o status mudou para 'cancelled'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
    
    -- Buscar nome do organizador e título do evento
    SELECT page_title INTO organizer_name FROM organizers WHERE id = NEW.organizer_id;
    event_title := NEW.title;
    
    -- Criar notificação para cada seguidor
    FOR follower_record IN 
      SELECT user_id FROM followers WHERE organizer_id = NEW.organizer_id
    LOOP
      INSERT INTO notifications (user_id, organizer_id, event_id, type, title, message)
      VALUES (
        follower_record.user_id,
        NEW.organizer_id,
        NEW.id,
        'event_cancelled',
        'Evento cancelado!',
        organizer_name || ' cancelou o evento "' || event_title || '"'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar triggers
CREATE TRIGGER on_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_on_event_create();

CREATE TRIGGER on_event_updated
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_on_event_update();

CREATE TRIGGER on_event_cancelled
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_on_event_cancel();

-- Atualizar trigger de atualização de timestamp
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();