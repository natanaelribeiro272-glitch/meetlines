/*
  # Adicionar categoria "Outros" como padrão

  ## Mudanças

  1. Atualizar organizadores sem categoria para "outros"
  2. Definir valor padrão da coluna category como "outros"

  ## Detalhes

  - Todos os organizadores que não têm categoria definida (NULL) receberão "outros"
  - Novos organizadores criados sem especificar categoria receberão "outros" automaticamente
  - A categoria "outros" será uma opção válida para usuários selecionarem seus interesses
*/

-- Atualizar organizadores existentes sem categoria para "outros"
UPDATE public.organizers
SET category = 'outros'
WHERE category IS NULL;

-- Definir valor padrão para novos registros
ALTER TABLE public.organizers
ALTER COLUMN category SET DEFAULT 'outros';

-- Adicionar comentário atualizado
COMMENT ON COLUMN public.organizers.category IS 'Categoria do organizador: festas, shows, fitness, igreja, cursos, bares, boates, esportes, encontros, outros (padrão)';
