-- Add interest options to profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_interest') THEN
    CREATE TYPE user_interest AS ENUM ('namoro', 'network', 'curtição', 'amizade', 'casual');
  END IF;
END $$;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS interest user_interest DEFAULT 'curtição';

-- Create organizer_photos table for photo uploads
CREATE TABLE IF NOT EXISTS public.organizer_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL,
  event_id UUID,
  photo_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizer_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for organizer_photos
CREATE POLICY "Organizers can manage their own photos" 
ON public.organizer_photos 
FOR ALL 
USING (organizer_id IN (
  SELECT o.id FROM organizers o WHERE o.user_id = auth.uid()
));

CREATE POLICY "Public can view active photos" 
ON public.organizer_photos 
FOR SELECT 
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_organizer_photos_updated_at
BEFORE UPDATE ON public.organizer_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();