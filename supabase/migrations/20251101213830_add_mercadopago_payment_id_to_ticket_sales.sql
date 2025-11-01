/*
  # Add mercadopago_payment_id to ticket_sales

  1. Changes
    - Add `mercadopago_payment_id` column to `ticket_sales` table to store the payment ID from Mercado Pago API
    - This is different from `mercadopago_preference_id` which stores the preference/checkout ID
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ticket_sales' 
    AND column_name = 'mercadopago_payment_id'
  ) THEN
    ALTER TABLE ticket_sales ADD COLUMN mercadopago_payment_id text;
  END IF;
END $$;
