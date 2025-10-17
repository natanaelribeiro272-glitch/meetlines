/*
  # Criar tabelas sociais e de usuários
  
  1. Tabelas criadas:
    - friendships: amizades entre usuários
    - user_likes: curtidas entre usuários
    - user_messages: mensagens entre usuários
    - stories: stories dos usuários
    - story_likes: curtidas em stories
    - story_comments: comentários em stories
    - story_views: visualizações de stories
    - projects: projetos de arte (AI)
    - generations: gerações de imagens AI
  
  2. Segurança:
    - RLS habilitado em todas as tabelas
    - Políticas de acesso restritivas
*/

CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CHECK (user_id <> friend_id)
);

CREATE TABLE IF NOT EXISTS public.user_likes (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS public.user_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stories (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours') NOT NULL
);

CREATE TABLE IF NOT EXISTS public.story_likes (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(story_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.story_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.story_views (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(story_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  prompt text,
  image_url text,
  style text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.generations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  image_url text,
  status text DEFAULT 'pending' NOT NULL,
  error_message text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships" ON public.friendships FOR SELECT USING (auth.uid() IN (user_id, friend_id));

DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
CREATE POLICY "Users can create friendships" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their friendships" ON public.friendships;
CREATE POLICY "Users can update their friendships" ON public.friendships FOR UPDATE USING (auth.uid() IN (user_id, friend_id));

DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can delete their friendships" ON public.friendships FOR DELETE USING (auth.uid() IN (user_id, friend_id));

DROP POLICY IF EXISTS "Users can view their likes" ON public.user_likes;
CREATE POLICY "Users can view their likes" ON public.user_likes FOR SELECT USING (auth.uid() IN (from_user_id, to_user_id));

DROP POLICY IF EXISTS "Users can like others" ON public.user_likes;
CREATE POLICY "Users can like others" ON public.user_likes FOR INSERT WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can unlike" ON public.user_likes;
CREATE POLICY "Users can unlike" ON public.user_likes FOR DELETE USING (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can view their messages" ON public.user_messages;
CREATE POLICY "Users can view their messages" ON public.user_messages FOR SELECT USING (auth.uid() IN (from_user_id, to_user_id));

DROP POLICY IF EXISTS "Users can send messages" ON public.user_messages;
CREATE POLICY "Users can send messages" ON public.user_messages FOR INSERT WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can update their messages" ON public.user_messages;
CREATE POLICY "Users can update their messages" ON public.user_messages FOR UPDATE USING (auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can view active stories" ON public.stories;
CREATE POLICY "Users can view active stories" ON public.stories FOR SELECT USING (expires_at > now());

DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
CREATE POLICY "Users can create their own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can like stories" ON public.story_likes;
CREATE POLICY "Users can like stories" ON public.story_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view story likes" ON public.story_likes;
CREATE POLICY "Anyone can view story likes" ON public.story_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can comment on stories" ON public.story_comments;
CREATE POLICY "Users can comment on stories" ON public.story_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view story comments" ON public.story_comments;
CREATE POLICY "Anyone can view story comments" ON public.story_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view story views" ON public.story_views;
CREATE POLICY "Anyone can view story views" ON public.story_views FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can record views" ON public.story_views;
CREATE POLICY "Users can record views" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their projects" ON public.projects;
CREATE POLICY "Users can update their projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their projects" ON public.projects;
CREATE POLICY "Users can delete their projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their generations" ON public.generations;
CREATE POLICY "Users can view their generations" ON public.generations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create generations" ON public.generations;
CREATE POLICY "Users can create generations" ON public.generations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_likes_from_user ON public.user_likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_to_user ON public.user_likes(to_user_id);