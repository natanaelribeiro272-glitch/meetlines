-- Add social links and visibility fields to organizers table
ALTER TABLE public.organizers
ADD COLUMN IF NOT EXISTS whatsapp_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS playlist_url text,
ADD COLUMN IF NOT EXISTS location_url text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS show_whatsapp boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_instagram boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_playlist boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_location boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_website boolean DEFAULT false;