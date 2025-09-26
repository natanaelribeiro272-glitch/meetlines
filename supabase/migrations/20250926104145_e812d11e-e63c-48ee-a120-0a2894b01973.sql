-- Criar tabela de curtidas de eventos
CREATE TABLE public.event_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Criar tabela de comentários de eventos
CREATE TABLE public.event_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de estatísticas de organizadores (followers, ratings, etc)
CREATE TABLE public.organizer_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL UNIQUE,
  followers_count INTEGER NOT NULL DEFAULT 0,
  events_count INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para event_likes
CREATE POLICY "Anyone can view event likes" 
ON public.event_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can like events" 
ON public.event_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike events" 
ON public.event_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para event_comments
CREATE POLICY "Anyone can view event comments" 
ON public.event_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create comments" 
ON public.event_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.event_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.event_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para organizer_stats
CREATE POLICY "Anyone can view organizer stats" 
ON public.organizer_stats 
FOR SELECT 
USING (true);

CREATE POLICY "Organizers can update their own stats" 
ON public.organizer_stats 
FOR ALL 
USING (organizer_id IN (
  SELECT id FROM organizers WHERE user_id = auth.uid()
));

-- Trigger para atualizar updated_at nos comentários
CREATE TRIGGER update_event_comments_updated_at
BEFORE UPDATE ON public.event_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at nas estatísticas
CREATE TRIGGER update_organizer_stats_updated_at
BEFORE UPDATE ON public.organizer_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar estatísticas do organizador
CREATE OR REPLACE FUNCTION update_organizer_stats(org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir ou atualizar estatísticas do organizador
  INSERT INTO public.organizer_stats (
    organizer_id,
    events_count
  )
  VALUES (
    org_id,
    (SELECT COUNT(*) FROM events WHERE organizer_id = org_id)
  )
  ON CONFLICT (organizer_id) 
  DO UPDATE SET 
    events_count = (SELECT COUNT(*) FROM events WHERE organizer_id = org_id),
    updated_at = now();
END;
$$;

-- Trigger para atualizar stats quando eventos são criados/atualizados
CREATE OR REPLACE FUNCTION handle_event_stats_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar stats do organizador
  PERFORM update_organizer_stats(COALESCE(NEW.organizer_id, OLD.organizer_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_organizer_stats_on_event_change
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW
EXECUTE FUNCTION handle_event_stats_update();