/*
  # Create Promo Codes System

  1. New Tables
    - `promo_codes`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `code` (text, unique) - O código promocional
      - `discount_type` (text) - 'percentage' ou 'fixed'
      - `discount_value` (numeric) - Valor do desconto (% ou R$)
      - `max_uses` (integer) - Máximo de usos (null = ilimitado)
      - `current_uses` (integer) - Usos atuais
      - `valid_from` (timestamptz) - Data início validade
      - `valid_until` (timestamptz) - Data fim validade
      - `min_purchase_amount` (numeric) - Valor mínimo de compra
      - `is_active` (boolean) - Se está ativo
      - `created_at` (timestamptz)
      - `created_by` (uuid, references profiles)

  2. New Table
    - `promo_code_uses`
      - `id` (uuid, primary key)
      - `promo_code_id` (uuid, references promo_codes)
      - `ticket_sale_id` (uuid, references ticket_sales)
      - `user_id` (uuid, references profiles)
      - `discount_applied` (numeric)
      - `used_at` (timestamptz)

  3. Security
    - Enable RLS on both tables
    - Organizers can manage their event promo codes
    - Users can view active promo codes
    - Track promo code usage
*/

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
  current_uses integer NOT NULL DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  min_purchase_amount numeric DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
  UNIQUE(event_id, code)
);

-- Create promo_code_uses table
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  ticket_sale_id uuid NOT NULL REFERENCES ticket_sales(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  discount_applied numeric NOT NULL,
  used_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Promo codes policies
CREATE POLICY "Organizers can view their event promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = promo_codes.event_id
      AND events.organizer_id IN (
        SELECT organizer_id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organizers can create promo codes for their events"
  ON promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = promo_codes.event_id
      AND events.organizer_id IN (
        SELECT organizer_id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organizers can update their event promo codes"
  ON promo_codes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = promo_codes.event_id
      AND events.organizer_id IN (
        SELECT organizer_id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organizers can delete their event promo codes"
  ON promo_codes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = promo_codes.event_id
      AND events.organizer_id IN (
        SELECT organizer_id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view active promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
  );

-- Promo code uses policies
CREATE POLICY "Users can view their own promo code uses"
  ON promo_code_uses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert promo code uses"
  ON promo_code_uses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organizers can view promo code uses for their events"
  ON promo_code_uses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM promo_codes
      JOIN events ON events.id = promo_codes.event_id
      WHERE promo_codes.id = promo_code_uses.promo_code_id
      AND events.organizer_id IN (
        SELECT organizer_id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_event_id ON promo_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_promo_code_id ON promo_code_uses(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_user_id ON promo_code_uses(user_id);

-- Add promo code fields to ticket_sales
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ticket_sales' AND column_name = 'promo_code_id'
  ) THEN
    ALTER TABLE ticket_sales ADD COLUMN promo_code_id uuid REFERENCES promo_codes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ticket_sales' AND column_name = 'promo_discount'
  ) THEN
    ALTER TABLE ticket_sales ADD COLUMN promo_discount numeric DEFAULT 0;
  END IF;
END $$;