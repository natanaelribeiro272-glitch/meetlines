/*
  # Criar tabelas principais faltantes
  
  1. Tabelas criadas:
    - event_likes: curtidas em eventos
    - event_comments: comentários em eventos
    - organizer_stats: estatísticas dos organizadores
    - organizer_photos: fotos dos organizadores
    - organizer_stories: stories dos organizadores
    - organizer_story_likes: curtidas em stories de organizadores
    - organizer_story_views: visualizações de stories
    - notifications: notificações dos usuários
  
  2. Segurança:
    - RLS habilitado em todas as tabelas
    - Políticas de acesso apropriadas
*/

CREATE TABLE IF NOT EXISTS public.event_likes (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.event_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organizer_stats (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organizer_id uuid NOT NULL UNIQUE REFERENCES public.organizers(id) ON DELETE CASCADE,
  followers_count integer DEFAULT 0 NOT NULL,
  events_count integer DEFAULT 0 NOT NULL,
  average_rating numeric(3,2) DEFAULT 0.0 NOT NULL,
  total_ratings integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organizer_photos (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organizer_id uuid NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  photo_url text NOT NULL,
  caption text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  session_name text
);

CREATE TABLE IF NOT EXISTS public.organizer_stories (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organizer_id uuid NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours') NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organizer_story_likes (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.organizer_stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(story_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.organizer_story_views (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.organizer_stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(story_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('event_created', 'event_updated', 'event_cancelled', 'user_like', 'follower', 'user_message')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view event likes" ON public.event_likes;
CREATE POLICY "Anyone can view event likes" ON public.event_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like events" ON public.event_likes;
CREATE POLICY "Users can like events" ON public.event_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike events" ON public.event_likes;
CREATE POLICY "Users can unlike events" ON public.event_likes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view event comments" ON public.event_comments;
CREATE POLICY "Anyone can view event comments" ON public.event_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON public.event_comments;
CREATE POLICY "Users can create comments" ON public.event_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.event_comments;
CREATE POLICY "Users can update their own comments" ON public.event_comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.event_comments;
CREATE POLICY "Users can delete their own comments" ON public.event_comments FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view organizer stats" ON public.organizer_stats;
CREATE POLICY "Anyone can view organizer stats" ON public.organizer_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active photos" ON public.organizer_photos;
CREATE POLICY "Public can view active photos" ON public.organizer_photos FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Organizers can manage their own photos" ON public.organizer_photos;
CREATE POLICY "Organizers can manage their own photos" ON public.organizer_photos FOR ALL USING (organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view non-expired stories" ON public.organizer_stories;
CREATE POLICY "Anyone can view non-expired stories" ON public.organizer_stories FOR SELECT USING (expires_at > now());

DROP POLICY IF EXISTS "Organizers can manage their own stories" ON public.organizer_stories;
CREATE POLICY "Organizers can manage their own stories" ON public.organizer_stories FOR ALL USING (organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can like stories" ON public.organizer_story_likes;
CREATE POLICY "Users can like stories" ON public.organizer_story_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike stories" ON public.organizer_story_likes;
CREATE POLICY "Users can unlike stories" ON public.organizer_story_likes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view story likes" ON public.organizer_story_likes;
CREATE POLICY "Anyone can view story likes" ON public.organizer_story_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view story views" ON public.organizer_story_views;
CREATE POLICY "Anyone can view story views" ON public.organizer_story_views FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can record story views" ON public.organizer_story_views;
CREATE POLICY "Users can record story views" ON public.organizer_story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);