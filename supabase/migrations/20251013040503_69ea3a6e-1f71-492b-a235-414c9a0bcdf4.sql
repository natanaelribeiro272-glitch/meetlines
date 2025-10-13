-- Modificar a coluna category para aceitar array de categorias
ALTER TABLE events ALTER COLUMN category TYPE text[] USING 
  CASE 
    WHEN category IS NULL THEN NULL
    ELSE ARRAY[category]
  END;

-- Fazer o mesmo para platform_events
ALTER TABLE platform_events ALTER COLUMN category TYPE text[] USING 
  CASE 
    WHEN category IS NULL THEN NULL
    ELSE ARRAY[category]
  END;