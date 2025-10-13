-- Criar tabela para stories de organizadores
CREATE TABLE public.organizer_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Habilitar RLS
ALTER TABLE public.organizer_stories ENABLE ROW LEVEL SECURITY;

-- Policy: Organizadores podem criar seus próprios stories
CREATE POLICY "Organizers can create their own stories"
ON public.organizer_stories
FOR INSERT
WITH CHECK (
  organizer_id IN (
    SELECT id FROM public.organizers WHERE user_id = auth.uid()
  )
);

-- Policy: Organizadores podem deletar seus próprios stories
CREATE POLICY "Organizers can delete their own stories"
ON public.organizer_stories
FOR DELETE
USING (
  organizer_id IN (
    SELECT id FROM public.organizers WHERE user_id = auth.uid()
  )
);

-- Policy: Todos podem visualizar stories de organizadores ativos
CREATE POLICY "Anyone can view organizer stories"
ON public.organizer_stories
FOR SELECT
USING (
  expires_at > now() AND
  organizer_id IN (
    SELECT id FROM public.organizers WHERE is_page_active = true
  )
);

-- Criar tabela para views de stories de organizadores
CREATE TABLE public.organizer_story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.organizer_stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Habilitar RLS
ALTER TABLE public.organizer_story_views ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem registrar suas próprias visualizações
CREATE POLICY "Users can record their story views"
ON public.organizer_story_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Policy: Usuários podem ver suas próprias visualizações
CREATE POLICY "Users can view their own views"
ON public.organizer_story_views
FOR SELECT
USING (auth.uid() = viewer_id);

-- Policy: Organizadores podem ver quem visualizou seus stories
CREATE POLICY "Organizers can view their story views"
ON public.organizer_story_views
FOR SELECT
USING (
  story_id IN (
    SELECT os.id 
    FROM public.organizer_stories os
    JOIN public.organizers o ON os.organizer_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

-- Criar tabela para likes em stories de organizadores
CREATE TABLE public.organizer_story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.organizer_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.organizer_story_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem curtir stories
CREATE POLICY "Users can like stories"
ON public.organizer_story_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem remover suas curtidas
CREATE POLICY "Users can unlike stories"
ON public.organizer_story_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Todos podem ver curtidas
CREATE POLICY "Anyone can view story likes"
ON public.organizer_story_likes
FOR SELECT
USING (true);

-- Criar índices para melhor performance
CREATE INDEX idx_organizer_stories_organizer_id ON public.organizer_stories(organizer_id);
CREATE INDEX idx_organizer_stories_expires_at ON public.organizer_stories(expires_at);
CREATE INDEX idx_organizer_story_views_story_id ON public.organizer_story_views(story_id);
CREATE INDEX idx_organizer_story_likes_story_id ON public.organizer_story_likes(story_id);