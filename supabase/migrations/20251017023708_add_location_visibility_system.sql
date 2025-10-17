/*
  Sistema de Visibilidade por Localizacao
  
  1. Novas Tabelas
    - cities: Cidades disponiveis no sistema
    - event_visible_cities: Cidades que podem ver cada evento
    - organizer_visible_cities: Cidades que podem ver cada organizador
  
  2. Alteracoes
    - events: adiciona city_id (cidade principal)
    - organizers: adiciona city_id (cidade base)
    - profiles: adiciona city_id (cidade do usuario)
  
  3. Seguranca
    - RLS habilitado em todas as tabelas
    - Organizadores gerenciam suas cidades visiveis
*/

-- Tabela de cidades
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  country text DEFAULT 'Brasil',
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, state, country)
);

-- Tabela de cidades visiveis para eventos
CREATE TABLE IF NOT EXISTS event_visible_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, city_id)
);

-- Tabela de cidades visiveis para organizadores
CREATE TABLE IF NOT EXISTS organizer_visible_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organizer_id, city_id)
);

-- Adicionar city_id nas tabelas existentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE events ADD COLUMN city_id uuid REFERENCES cities(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE organizers ADD COLUMN city_id uuid REFERENCES cities(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city_id uuid REFERENCES cities(id);
  END IF;
END $$;

-- RLS para cities
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cities"
  ON cities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cities"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS para event_visible_cities
ALTER TABLE event_visible_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read event visible cities"
  ON event_visible_cities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event organizers can manage their event visible cities"
  ON event_visible_cities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_visible_cities.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_visible_cities.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

-- RLS para organizer_visible_cities
ALTER TABLE organizer_visible_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read organizer visible cities"
  ON organizer_visible_cities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizers can manage their visible cities"
  ON organizer_visible_cities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_visible_cities.organizer_id
      AND organizers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_visible_cities.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

-- Inserir algumas cidades brasileiras principais
INSERT INTO cities (name, state, country) VALUES
  ('São Paulo', 'SP', 'Brasil'),
  ('Rio de Janeiro', 'RJ', 'Brasil'),
  ('Belo Horizonte', 'MG', 'Brasil'),
  ('Brasília', 'DF', 'Brasil'),
  ('Salvador', 'BA', 'Brasil'),
  ('Fortaleza', 'CE', 'Brasil'),
  ('Curitiba', 'PR', 'Brasil'),
  ('Recife', 'PE', 'Brasil'),
  ('Porto Alegre', 'RS', 'Brasil'),
  ('Manaus', 'AM', 'Brasil'),
  ('Campinas', 'SP', 'Brasil'),
  ('São Bernardo do Campo', 'SP', 'Brasil'),
  ('Santo André', 'SP', 'Brasil'),
  ('São Caetano do Sul', 'SP', 'Brasil'),
  ('Guarulhos', 'SP', 'Brasil'),
  ('Osasco', 'SP', 'Brasil'),
  ('Niterói', 'RJ', 'Brasil'),
  ('Duque de Caxias', 'RJ', 'Brasil'),
  ('Contagem', 'MG', 'Brasil'),
  ('Betim', 'MG', 'Brasil')
ON CONFLICT (name, state, country) DO NOTHING;