-- Create messages table for direct chat between users
CREATE TABLE IF NOT EXISTS public.user_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.user_messages
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- Users can view messages they sent or received
CREATE POLICY "Users can view their messages"
ON public.user_messages
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can update read status on messages they received
CREATE POLICY "Users can mark messages as read"
ON public.user_messages
FOR UPDATE
USING (auth.uid() = to_user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_messages_from_user ON public.user_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_to_user ON public.user_messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON public.user_messages(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_messages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_user_messages_updated_at_trigger ON public.user_messages;
CREATE TRIGGER update_user_messages_updated_at_trigger
  BEFORE UPDATE ON public.user_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_messages_updated_at();

-- Function to notify user when they receive a message
CREATE OR REPLACE FUNCTION public.notify_user_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get the name of the sender
  SELECT display_name INTO sender_name 
  FROM profiles 
  WHERE user_id = NEW.from_user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, organizer_id)
  VALUES (
    NEW.to_user_id,
    'user_message',
    'Nova mensagem!',
    COALESCE(sender_name, 'Alguém') || ' enviou uma mensagem',
    '00000000-0000-0000-0000-000000000000'::uuid
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to send notification on new message
DROP TRIGGER IF EXISTS on_user_message_created ON public.user_messages;
CREATE TRIGGER on_user_message_created
  AFTER INSERT ON public.user_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_on_message();

-- Update notifications constraint to include user_message type
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('event_created', 'event_updated', 'event_cancelled', 'user_like', 'follower', 'user_message'));