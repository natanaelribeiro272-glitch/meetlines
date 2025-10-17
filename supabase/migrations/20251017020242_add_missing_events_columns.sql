/*
  # Adicionar colunas faltantes na tabela events
  
  1. Novas colunas:
    - interests: array de interesses relacionados ao evento
    - requires_registration: se requer inscrição
    - location_link: link da localização (Google Maps, etc)
    - category: array de categorias do evento
    - form_fields: campos customizados do formulário de inscrição (JSONB)
    - ticket_link: link para compra de ingressos
    - end_date: data e hora de término do evento (obrigatório)
    - ticket_price: preço do ingresso
    - pix_key, bank_name, bank_account_type, bank_agency, bank_account, bank_account_holder, bank_document: dados bancários
  
  2. Observações:
    - Colunas são adicionadas apenas se não existirem
*/

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS requires_registration boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS location_link text,
ADD COLUMN IF NOT EXISTS category text[],
ADD COLUMN IF NOT EXISTS form_fields jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ticket_link text,
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS ticket_price numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pix_key text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_type text,
ADD COLUMN IF NOT EXISTS bank_agency text,
ADD COLUMN IF NOT EXISTS bank_account text,
ADD COLUMN IF NOT EXISTS bank_account_holder text,
ADD COLUMN IF NOT EXISTS bank_document text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'end_date'
    AND is_nullable = 'YES'
  ) THEN
    UPDATE public.events 
    SET end_date = event_date + interval '4 hours' 
    WHERE end_date IS NULL;
    
    ALTER TABLE public.events 
    ALTER COLUMN end_date SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_interests ON public.events USING GIN(interests);

COMMENT ON COLUMN public.events.form_fields IS 'Custom form fields configuration for event registration';
COMMENT ON COLUMN public.events.ticket_link IS 'URL for purchasing event tickets (only for paid events)';
COMMENT ON COLUMN public.events.end_date IS 'Data e hora de encerramento do evento (obrigatório)';
COMMENT ON COLUMN public.events.ticket_price IS 'Preço do ingresso em reais. 0 significa gratuito';