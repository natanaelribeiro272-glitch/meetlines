/*
  # Add payment preference to organizers

  1. Changes
    - Add `payment_preference` column to organizers table
      - Options: 'stripe_direct' (immediate to Stripe) or 'platform_transfer' (3 business days after event)
      - Defaults to 'stripe_direct' when Stripe Connect is enabled
    
  2. Notes
    - This allows organizers to choose between immediate Stripe transfers or platform-managed transfers
    - Platform transfers happen 3 business days after the event ends
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'payment_preference'
  ) THEN
    ALTER TABLE organizers 
    ADD COLUMN payment_preference text DEFAULT 'platform_transfer' CHECK (payment_preference IN ('stripe_direct', 'platform_transfer'));
  END IF;
END $$;

COMMENT ON COLUMN organizers.payment_preference IS 'Payment preference: stripe_direct for immediate Stripe transfers, platform_transfer for 3-day platform transfers';
