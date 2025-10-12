-- Create trigger to notify user when receiving a friend request
CREATE OR REPLACE FUNCTION public.notify_on_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requester_name TEXT;
BEGIN
  -- Only notify when status is 'pending'
  IF NEW.status = 'pending' THEN
    -- Get the name of the person who sent the request
    SELECT display_name INTO requester_name 
    FROM profiles 
    WHERE user_id = NEW.user_id;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, organizer_id)
    VALUES (
      NEW.friend_id,
      'friend_request',
      'Nova solicitação de amizade',
      COALESCE(requester_name, 'Alguém') || ' quer ser seu amigo',
      '00000000-0000-0000-0000-000000000000'::uuid
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for friend requests
CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_friend_request();