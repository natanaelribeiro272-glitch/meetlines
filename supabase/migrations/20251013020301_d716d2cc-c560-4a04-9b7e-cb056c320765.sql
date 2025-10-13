-- Alterar taxa da plataforma de 10% para 5%
ALTER TABLE public.event_ticket_settings 
ALTER COLUMN platform_fee_percentage SET DEFAULT 5.00;

-- Atualizar registros existentes
UPDATE public.event_ticket_settings 
SET platform_fee_percentage = 5.00 
WHERE platform_fee_percentage = 10.00;