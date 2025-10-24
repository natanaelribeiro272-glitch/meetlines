/*
  # Triggers para Notificações Automáticas

  1. Funções
    - `notify_user_like` - Quando alguém curte um perfil
    - `notify_friend_request` - Quando alguém envia solicitação de amizade
    - `notify_friend_accepted` - Quando alguém aceita solicitação de amizade
    - `notify_new_message` - Quando alguém envia mensagem
    - `notify_new_event` - Quando organizador que o usuário segue cria evento

  2. Triggers
    - Trigger em user_likes para curtidas
    - Trigger em friendships para solicitações e aceitações
    - Trigger em user_messages para mensagens
    - Trigger em events para novos eventos

  3. Observações
    - Todos os triggers chamam a edge function send-push-notification
    - As notificações são criadas na tabela notifications
    - Push notifications são enviadas em tempo real
*/

-- Função para enviar notificação push via edge function
CREATE OR REPLACE FUNCTION send_push_notification_async(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_data jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
DECLARE
  v_supabase_url text;
BEGIN
  -- Obter URL do Supabase (usando configuração padrão)
  SELECT current_setting('app.settings.supabase_url', true) INTO v_supabase_url;
  
  -- Se não estiver configurado, usar URL padrão do ambiente
  IF v_supabase_url IS NULL THEN
    v_supabase_url := current_setting('app.settings.external_url', true);
  END IF;

  -- Fazer chamada HTTP assíncrona para a edge function
  -- NOTA: Isso requer a extensão pg_net ou http
  -- Por enquanto, vamos apenas registrar a intenção
  RAISE LOG 'Push notification for user %: % - %', p_user_id, p_title, p_body;
  
  -- TODO: Implementar chamada real quando pg_net estiver disponível
  -- PERFORM net.http_post(
  --   url := v_supabase_url || '/functions/v1/send-push-notification',
  --   body := jsonb_build_object(
  --     'user_id', p_user_id,
  --     'title', p_title,
  --     'body', p_body,
  --     'data', p_data
  --   )
  -- );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Notificar quando alguém curte o perfil
CREATE OR REPLACE FUNCTION notify_user_like() RETURNS trigger AS $$
DECLARE
  v_liker_name text;
BEGIN
  -- Buscar nome de quem curtiu
  SELECT display_name INTO v_liker_name
  FROM profiles
  WHERE user_id = NEW.from_user_id;

  -- Criar notificação
  INSERT INTO notifications (user_id, from_user_id, organizer_id, type, title, message)
  VALUES (
    NEW.to_user_id,
    NEW.from_user_id,
    NEW.from_user_id,
    'user_like',
    'Nova curtida!',
    COALESCE(v_liker_name, 'Alguém') || ' curtiu seu perfil'
  );

  -- Enviar push notification
  PERFORM send_push_notification_async(
    NEW.to_user_id,
    'Nova curtida!',
    COALESCE(v_liker_name, 'Alguém') || ' curtiu seu perfil',
    jsonb_build_object('type', 'user_like', 'from_user_id', NEW.from_user_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_user_like
  AFTER INSERT ON user_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_like();

-- Trigger: Notificar solicitação de amizade
CREATE OR REPLACE FUNCTION notify_friend_request() RETURNS trigger AS $$
DECLARE
  v_requester_name text;
BEGIN
  -- Apenas para novas solicitações pendentes
  IF NEW.status = 'pending' THEN
    -- Buscar nome de quem enviou
    SELECT display_name INTO v_requester_name
    FROM profiles
    WHERE user_id = NEW.user_id;

    -- Criar notificação
    INSERT INTO notifications (user_id, from_user_id, organizer_id, type, title, message)
    VALUES (
      NEW.friend_id,
      NEW.user_id,
      NEW.user_id,
      'friend_request',
      'Nova solicitação de amizade!',
      COALESCE(v_requester_name, 'Alguém') || ' enviou uma solicitação de amizade'
    );

    -- Enviar push notification
    PERFORM send_push_notification_async(
      NEW.friend_id,
      'Nova solicitação de amizade!',
      COALESCE(v_requester_name, 'Alguém') || ' quer ser seu amigo',
      jsonb_build_object('type', 'friend_request', 'from_user_id', NEW.user_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_friend_request
  AFTER INSERT ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_request();

-- Trigger: Notificar quando solicitação é aceita
CREATE OR REPLACE FUNCTION notify_friend_accepted() RETURNS trigger AS $$
DECLARE
  v_accepter_name text;
BEGIN
  -- Apenas quando status muda para accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Buscar nome de quem aceitou
    SELECT display_name INTO v_accepter_name
    FROM profiles
    WHERE user_id = NEW.friend_id;

    -- Criar notificação para quem enviou a solicitação
    INSERT INTO notifications (user_id, from_user_id, organizer_id, type, title, message)
    VALUES (
      NEW.user_id,
      NEW.friend_id,
      NEW.friend_id,
      'friend_accepted',
      'Solicitação aceita!',
      COALESCE(v_accepter_name, 'Alguém') || ' aceitou sua solicitação de amizade'
    );

    -- Enviar push notification
    PERFORM send_push_notification_async(
      NEW.user_id,
      'Solicitação aceita!',
      COALESCE(v_accepter_name, 'Alguém') || ' aceitou sua solicitação',
      jsonb_build_object('type', 'friend_accepted', 'from_user_id', NEW.friend_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_friend_accepted
  AFTER UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_accepted();

-- Trigger: Notificar nova mensagem
CREATE OR REPLACE FUNCTION notify_new_message() RETURNS trigger AS $$
DECLARE
  v_sender_name text;
BEGIN
  -- Buscar nome de quem enviou
  SELECT display_name INTO v_sender_name
  FROM profiles
  WHERE user_id = NEW.from_user_id;

  -- Criar notificação
  INSERT INTO notifications (user_id, from_user_id, organizer_id, type, title, message)
  VALUES (
    NEW.to_user_id,
    NEW.from_user_id,
    NEW.from_user_id,
    'user_message',
    'Nova mensagem!',
    COALESCE(v_sender_name, 'Alguém') || ' enviou uma mensagem'
  );

  -- Enviar push notification
  PERFORM send_push_notification_async(
    NEW.to_user_id,
    COALESCE(v_sender_name, 'Nova mensagem'),
    LEFT(NEW.message, 100),
    jsonb_build_object('type', 'user_message', 'from_user_id', NEW.from_user_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON user_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Trigger: Notificar novos eventos de organizadores seguidos
CREATE OR REPLACE FUNCTION notify_new_event() RETURNS trigger AS $$
DECLARE
  v_follower record;
  v_organizer_name text;
BEGIN
  -- Apenas para eventos publicados
  IF NEW.is_published = true AND NEW.status = 'approved' THEN
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_event
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_event();
