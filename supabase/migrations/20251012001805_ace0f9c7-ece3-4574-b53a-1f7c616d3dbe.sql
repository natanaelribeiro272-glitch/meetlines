-- Adicionar campo de preço na tabela events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS ticket_price numeric(10,2) DEFAULT 0;

-- Adicionar campo de preço na tabela platform_events
ALTER TABLE public.platform_events 
ADD COLUMN IF NOT EXISTS ticket_price numeric(10,2) DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN public.events.ticket_price IS 'Preço do ingresso em reais. 0 significa gratuito';
COMMENT ON COLUMN public.platform_events.ticket_price IS 'Preço do ingresso em reais. 0 significa gratuito';