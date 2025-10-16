-- Adicionar coluna para múltiplos interesses do usuário
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- Criar índice para busca eficiente por interesses
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON public.profiles USING GIN(interests);

COMMENT ON COLUMN public.profiles.interests IS 'Lista de categorias de interesse do usuário: festas, shows, fitness, igreja, cursos, bares, boates, esportes';