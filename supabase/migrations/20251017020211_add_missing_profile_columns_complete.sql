/*
  # Adicionar colunas faltantes na tabela profiles
  
  1. Novas colunas:
    - age: idade do usuário
    - twitter_url, linkedin_url, facebook_url, tiktok_url, youtube_url: URLs de redes sociais
    - interest: tipo de interesse do usuário (ENUM)
    - notes_visible: visibilidade das notas
    - find_friends_visible: visibilidade no recurso Find Friends
    - relationship_status: status de relacionamento (ENUM)
    - latitude, longitude: coordenadas de localização
    - location_updated_at: timestamp da última atualização de localização
    - story_visible_to: controle de visibilidade dos stories
  
  2. Observações:
    - Todas as colunas são opcionais e possuem valores padrão apropriados
*/

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS tiktok_url text,
ADD COLUMN IF NOT EXISTS youtube_url text,
ADD COLUMN IF NOT EXISTS interest public.user_interest DEFAULT 'curtição',
ADD COLUMN IF NOT EXISTS notes_visible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS find_friends_visible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS relationship_status public.relationship_status DEFAULT 'preferencia_nao_informar',
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS location_updated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS story_visible_to text DEFAULT 'both' CHECK (story_visible_to IN ('both', 'friends_only', 'nearby_only'));

COMMENT ON COLUMN public.profiles.find_friends_visible IS 'Controls if user wants to be visible in Find Friends feature during live events';
COMMENT ON COLUMN public.profiles.interests IS 'Lista de categorias de interesse do usuário: festas, shows, fitness, igreja, cursos, bares, boates, esportes';