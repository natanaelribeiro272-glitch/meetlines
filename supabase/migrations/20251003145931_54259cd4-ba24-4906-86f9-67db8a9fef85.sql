-- Adicionar coluna para link de localização nos eventos
ALTER TABLE public.events
ADD COLUMN location_link text;