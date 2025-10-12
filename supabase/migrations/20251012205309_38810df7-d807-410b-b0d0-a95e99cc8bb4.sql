-- Adicionar coluna ticket_link na tabela platform_events
ALTER TABLE public.platform_events
ADD COLUMN IF NOT EXISTS ticket_link text;

-- Comentário para documentação
COMMENT ON COLUMN public.platform_events.ticket_link IS 'Link externo para compra de ingressos (Sympla, Eventbrite, etc)';