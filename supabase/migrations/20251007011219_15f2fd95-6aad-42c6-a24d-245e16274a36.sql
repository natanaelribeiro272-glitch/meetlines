-- Adicionar coluna de data/hora de encerramento aos eventos
ALTER TABLE public.events
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhorar performance de buscas por eventos que precisam ser encerrados
CREATE INDEX idx_events_end_date ON public.events(end_date) 
WHERE end_date IS NOT NULL AND status != 'completed';