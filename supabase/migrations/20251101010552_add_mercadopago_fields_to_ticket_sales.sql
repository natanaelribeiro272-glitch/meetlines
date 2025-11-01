/*
  # Add Mercado Pago fields to ticket_sales

  1. Changes
    - Add `mercadopago_preference_id` column for storing Mercado Pago preference ID
    - Add `payment_method` column to differentiate between payment gateways
    - Add `payment_gateway` column to identify which gateway was used (mercadopago/stripe)
  
  2. Purpose
    - Allow both Stripe and Mercado Pago to coexist
    - Properly track which payment gateway processed each transaction
    - Avoid conflicts when storing payment references
*/

-- Add columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_sales' AND column_name = 'mercadopago_preference_id'
  ) THEN
    ALTER TABLE public.ticket_sales ADD COLUMN mercadopago_preference_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_sales' AND column_name = 'payment_gateway'
  ) THEN
    ALTER TABLE public.ticket_sales ADD COLUMN payment_gateway TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_sales' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.ticket_sales ADD COLUMN payment_method TEXT;
  END IF;
END $$;