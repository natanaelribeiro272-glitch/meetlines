/*
  # Add Stripe Connect fields to organizers table

  1. Changes
    - Add `stripe_connect_account_id` column to store the Stripe Connect account ID
    - Add `stripe_connect_onboarding_complete` column to track onboarding status
    - Add `stripe_connect_details_submitted` column to track if details were submitted
    - Add `stripe_connect_charges_enabled` column to track if charges are enabled
    - Add `stripe_connect_payouts_enabled` column to track if payouts are enabled
    
  2. Security
    - No RLS changes needed (existing policies cover these fields)
*/

-- Add Stripe Connect fields to organizers table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' AND column_name = 'stripe_connect_account_id'
  ) THEN
    ALTER TABLE organizers ADD COLUMN stripe_connect_account_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' AND column_name = 'stripe_connect_onboarding_complete'
  ) THEN
    ALTER TABLE organizers ADD COLUMN stripe_connect_onboarding_complete boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' AND column_name = 'stripe_connect_details_submitted'
  ) THEN
    ALTER TABLE organizers ADD COLUMN stripe_connect_details_submitted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' AND column_name = 'stripe_connect_charges_enabled'
  ) THEN
    ALTER TABLE organizers ADD COLUMN stripe_connect_charges_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' AND column_name = 'stripe_connect_payouts_enabled'
  ) THEN
    ALTER TABLE organizers ADD COLUMN stripe_connect_payouts_enabled boolean DEFAULT false;
  END IF;
END $$;