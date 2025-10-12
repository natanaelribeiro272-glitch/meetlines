-- Encerrar eventos sem data de finalização
-- Atualizar eventos regulares sem end_date
UPDATE public.events
SET 
  status = 'completed',
  end_date = event_date + INTERVAL '4 hours'
WHERE end_date IS NULL AND status != 'cancelled';

-- Atualizar platform_events sem end_date
UPDATE public.platform_events
SET 
  status = 'completed',
  end_date = event_date + INTERVAL '4 hours'
WHERE end_date IS NULL AND status != 'cancelled';

-- Tornar end_date obrigatório na tabela events
ALTER TABLE public.events
ALTER COLUMN end_date SET NOT NULL;

-- Tornar end_date obrigatório na tabela platform_events
ALTER TABLE public.platform_events
ALTER COLUMN end_date SET NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.events.end_date IS 'Data e hora de encerramento do evento (obrigatório)';
COMMENT ON COLUMN public.platform_events.end_date IS 'Data e hora de encerramento do evento (obrigatório)';