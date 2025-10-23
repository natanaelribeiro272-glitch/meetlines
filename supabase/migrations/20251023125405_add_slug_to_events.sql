/*
  # Adicionar slug aos eventos
  
  1. Alterações
    - Adiciona coluna `slug` na tabela `events` para URLs amigáveis
    - Cria função para gerar slug a partir do título
    - Atualiza eventos existentes com slugs
    - Adiciona índice único para slugs
    
  2. Segurança
    - Mantém todas as políticas RLS existentes
*/

-- Adicionar coluna slug
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS slug text;

-- Função para gerar slug
CREATE OR REPLACE FUNCTION generate_slug(title text, event_id uuid)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Gerar slug base: lowercase, remove acentos, substitui espaços por hífen
  base_slug := lower(trim(title));
  base_slug := regexp_replace(base_slug, '[áàâãä]', 'a', 'g');
  base_slug := regexp_replace(base_slug, '[éèêë]', 'e', 'g');
  base_slug := regexp_replace(base_slug, '[íìîï]', 'i', 'g');
  base_slug := regexp_replace(base_slug, '[óòôõö]', 'o', 'g');
  base_slug := regexp_replace(base_slug, '[úùûü]', 'u', 'g');
  base_slug := regexp_replace(base_slug, '[ç]', 'c', 'g');
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Adicionar ID do evento para garantir unicidade
  final_slug := base_slug || '-' || substring(event_id::text from 1 for 8);
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Atualizar eventos existentes com slugs
UPDATE events 
SET slug = generate_slug(title, id)
WHERE slug IS NULL;

-- Criar índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique_idx ON events(slug);

-- Trigger para gerar slug automaticamente em novos eventos
CREATE OR REPLACE FUNCTION set_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_slug_trigger ON events;
CREATE TRIGGER events_slug_trigger
  BEFORE INSERT OR UPDATE OF title ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_event_slug();