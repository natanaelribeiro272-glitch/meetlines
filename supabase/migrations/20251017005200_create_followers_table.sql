/*
  # Create Followers Table
  
  1. New Tables
    - `followers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `organizer_id` (uuid, references organizers)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on followers table
    - Add policies for users to follow/unfollow organizers
    - Add policy for organizers to view their followers
*/

-- Create followers table
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organizer_id)
);

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for followers table
CREATE POLICY "Users can view their own follows"
  ON public.followers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow organizers"
  ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow organizers"
  ON public.followers FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view their followers"
  ON public.followers FOR SELECT
  USING (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view follower counts"
  ON public.followers FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_followers_user_id ON public.followers(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_organizer_id ON public.followers(organizer_id);