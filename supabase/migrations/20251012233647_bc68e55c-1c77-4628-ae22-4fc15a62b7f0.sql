-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Create story views table
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Create story likes table
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Create story comments table
CREATE TABLE public.story_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Users can view nearby users stories"
ON public.stories FOR SELECT
USING (true);

CREATE POLICY "Users can create their own stories"
ON public.stories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
ON public.stories FOR DELETE
USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Users can view story views"
ON public.story_views FOR SELECT
USING (true);

CREATE POLICY "Users can record their story views"
ON public.story_views FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Story likes policies
CREATE POLICY "Users can view story likes"
ON public.story_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like stories"
ON public.story_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike stories"
ON public.story_likes FOR DELETE
USING (auth.uid() = user_id);

-- Story comments policies
CREATE POLICY "Users can view story comments"
ON public.story_comments FOR SELECT
USING (true);

CREATE POLICY "Users can comment on stories"
ON public.story_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.story_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_story_likes_story_id ON public.story_likes(story_id);
CREATE INDEX idx_story_comments_story_id ON public.story_comments(story_id);

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_comments;