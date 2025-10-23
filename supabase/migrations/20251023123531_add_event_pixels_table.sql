/*
  # Add Event Pixels Integration

  1. New Tables
    - `event_pixels`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `platform` (text) - Facebook, Google Ads, TikTok, etc
      - `pixel_id` (text) - ID do pixel
      - `conversion_events` (jsonb) - Eventos de conversão configurados
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `event_pixels` table
    - Add policies for organizers to manage their event pixels
*/

-- Create event_pixels table
CREATE TABLE IF NOT EXISTS event_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'google_ads', 'tiktok', 'linkedin', 'twitter', 'custom')),
  pixel_id text NOT NULL,
  conversion_events jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE event_pixels ENABLE ROW LEVEL SECURITY;

-- Organizers can view pixels for their events
CREATE POLICY "Organizers can view their event pixels"
  ON event_pixels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE e.id = event_pixels.event_id
      AND o.user_id = auth.uid()
    )
  );

-- Organizers can insert pixels for their events
CREATE POLICY "Organizers can insert pixels for their events"
  ON event_pixels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE e.id = event_pixels.event_id
      AND o.user_id = auth.uid()
    )
  );

-- Organizers can update pixels for their events
CREATE POLICY "Organizers can update their event pixels"
  ON event_pixels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE e.id = event_pixels.event_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE e.id = event_pixels.event_id
      AND o.user_id = auth.uid()
    )
  );

-- Organizers can delete pixels for their events
CREATE POLICY "Organizers can delete their event pixels"
  ON event_pixels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE e.id = event_pixels.event_id
      AND o.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_pixels_event_id ON event_pixels(event_id);
CREATE INDEX IF NOT EXISTS idx_event_pixels_platform ON event_pixels(platform);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_event_pixels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_pixels_updated_at
  BEFORE UPDATE ON event_pixels
  FOR EACH ROW
  EXECUTE FUNCTION update_event_pixels_updated_at();