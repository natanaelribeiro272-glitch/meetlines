/*
  # Fix notify_new_message function to use 'content' field
  
  1. Changes
    - Update function to use NEW.content instead of NEW.message
    - The user_messages table has 'content' column, not 'message'
  
  2. Security
    - Maintains SECURITY DEFINER for proper permissions
*/

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Enviar push notification usando o campo correto 'content'
  PERFORM send_push_notification_async(
    NEW.to_user_id,
    COALESCE(v_sender_name, 'Nova mensagem'),
    LEFT(NEW.content, 100),  -- Changed from NEW.message to NEW.content
    jsonb_build_object('type', 'user_message', 'from_user_id', NEW.from_user_id)
  );

  RETURN NEW;
END;
$$;
