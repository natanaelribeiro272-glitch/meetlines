-- Adicionar campos para dados de pagamento do organizador
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS pix_key text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_type text,
ADD COLUMN IF NOT EXISTS bank_agency text,
ADD COLUMN IF NOT EXISTS bank_account text,
ADD COLUMN IF NOT EXISTS bank_account_holder text,
ADD COLUMN IF NOT EXISTS bank_document text;