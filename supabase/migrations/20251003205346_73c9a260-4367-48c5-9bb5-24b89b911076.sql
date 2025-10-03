-- Create user_likes table for friend connections
CREATE TABLE IF NOT EXISTS public.user_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

-- Enable RLS
ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;

-- Users can create likes
CREATE POLICY "Users can like others"
ON public.user_likes
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- Users can view likes they sent or received
CREATE POLICY "Users can view their likes"
ON public.user_likes
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can unlike
CREATE POLICY "Users can unlike"
ON public.user_likes
FOR DELETE
USING (auth.uid() = from_user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_likes_from_user ON public.user_likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_to_user ON public.user_likes(to_user_id);

-- Function to notify user when they receive a like
CREATE OR REPLACE FUNCTION public.notify_user_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  liker_name TEXT;
BEGIN
  -- Get the name of the person who liked
  SELECT display_name INTO liker_name 
  FROM profiles 
  WHERE user_id = NEW.from_user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, organizer_id)
  VALUES (
    NEW.to_user_id,
    'user_like',
    'Nova curtida!',
    COALESCE(liker_name, 'Alguém') || ' curtiu seu perfil',
    '00000000-0000-0000-0000-000000000000'::uuid -- placeholder organizer_id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to send notification on like
DROP TRIGGER IF EXISTS on_user_like_created ON public.user_likes;
CREATE TRIGGER on_user_like_created
  AFTER INSERT ON public.user_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_on_like();