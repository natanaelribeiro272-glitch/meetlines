/*
  # Add Stripe Connect fields to organizers table

  1. Changes to organizers table
    - Add `stripe_account_id` - Stores the Stripe Connect account ID for the organizer
    - Add `stripe_account_status` - Tracks onboarding status (pending, active, restricted, disabled)
    - Add `stripe_onboarding_completed` - Boolean flag for completed onboarding
    - Add `stripe_charges_enabled` - Whether the account can accept charges
    - Add `stripe_payouts_enabled` - Whether the account can receive payouts
    - Add `stripe_details_submitted` - Whether all required details are submitted
    - Add `stripe_connected_at` - Timestamp when Stripe account was connected

  2. Purpose
    - Enable Stripe Connect integration where each organizer has their own Stripe account
    - Platform acts as facilitator, organizers receive funds directly (minus platform fee)
    - Track onboarding status and account capabilities
*/

-- Add Stripe Connect fields to organizers table
DO $$
BEGIN
  -- Add stripe_account_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'stripe_account_id'
  ) THEN
    ALTER TABLE public.organizers ADD COLUMN stripe_account_id TEXT;
  END IF;

  -- Add stripe_account_status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'stripe_account_status'
  ) THEN
    ALTER TABLE public.organizers ADD COLUMN stripe_account_status TEXT DEFAULT 'pending';
  END IF;

  -- Add stripe_onboarding_completed if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'stripe_onboarding_completed'
  ) THEN
    ALTER TABLE public.organizers ADD COLUMN stripe_onboarding_completed BOOLEAN DEFAULT false;
  END IF;

  -- Add stripe_charges_enabled if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'stripe_charges_enabled'
  ) THEN
    ALTER TABLE public.organizers ADD COLUMN stripe_charges_enabled BOOLEAN DEFAULT false;
  END IF;

  -- Add stripe_payouts_enabled if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'stripe_payouts_enabled'
  ) THEN
    ALTER TABLE public.organizers ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT false;
  END IF;

  -- Add stripe_details_submitted if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'stripe_details_submitted'
  ) THEN
    ALTER TABLE public.organizers ADD COLUMN stripe_details_submitted BOOLEAN DEFAULT false;
  END IF;

  -- Add stripe_connected_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'stripe_connected_at'
  ) THEN
    ALTER TABLE public.organizers ADD COLUMN stripe_connected_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create index for faster lookups by stripe_account_id
CREATE INDEX IF NOT EXISTS idx_organizers_stripe_account_id ON public.organizers(stripe_account_id);

-- Add comment explaining the fields
COMMENT ON COLUMN public.organizers.stripe_account_id IS 'Stripe Connect account ID for receiving payments';
COMMENT ON COLUMN public.organizers.stripe_account_status IS 'Status: pending, active, restricted, disabled';
COMMENT ON COLUMN public.organizers.stripe_onboarding_completed IS 'Whether Stripe onboarding is complete';
COMMENT ON COLUMN public.organizers.stripe_charges_enabled IS 'Whether account can accept charges';
COMMENT ON COLUMN public.organizers.stripe_payouts_enabled IS 'Whether account can receive payouts';
