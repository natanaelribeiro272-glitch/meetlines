-- Create followers table
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organizer_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, organizer_id)
);

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all followers"
ON public.followers
FOR SELECT
USING (true);

CREATE POLICY "Users can follow organizers"
ON public.followers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow organizers"
ON public.followers
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_followers_user_id ON public.followers(user_id);
CREATE INDEX idx_followers_organizer_id ON public.followers(organizer_id);