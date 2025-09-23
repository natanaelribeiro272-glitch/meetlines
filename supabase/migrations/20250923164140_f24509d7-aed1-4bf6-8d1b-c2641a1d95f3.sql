-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('user', 'organizer');

-- Update profiles table to include user role and additional fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Create organizers table for extended organizer profiles
CREATE TABLE public.organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  page_title TEXT NOT NULL,
  page_subtitle TEXT,
  page_description TEXT,
  theme TEXT DEFAULT 'dark',
  primary_color TEXT DEFAULT '#8b5cf6',
  cover_image_url TEXT,
  show_statistics BOOLEAN DEFAULT true,
  show_events BOOLEAN DEFAULT true,
  show_contact BOOLEAN DEFAULT true,
  is_page_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom links table
CREATE TABLE public.custom_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#8b5cf6',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event registrations table
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  registration_data JSONB,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlist')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizers table
CREATE POLICY "Organizers can view their own profile"
  ON public.organizers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Organizers can update their own profile"
  ON public.organizers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Organizers can insert their own profile"
  ON public.organizers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view active organizer pages"
  ON public.organizers FOR SELECT
  USING (is_page_active = true);

-- RLS Policies for events table
CREATE POLICY "Organizers can manage their own events"
  ON public.events FOR ALL
  USING (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view events"
  ON public.events FOR SELECT
  USING (true);

-- RLS Policies for custom_links table
CREATE POLICY "Organizers can manage their own links"
  ON public.custom_links FOR ALL
  USING (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active links"
  ON public.custom_links FOR SELECT
  USING (is_active = true);

-- RLS Policies for event_registrations table
CREATE POLICY "Users can view their own registrations"
  ON public.event_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own registrations"
  ON public.event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can view registrations for their events"
  ON public.event_registrations FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at columns
CREATE TRIGGER update_organizers_updated_at
  BEFORE UPDATE ON public.organizers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_links_updated_at
  BEFORE UPDATE ON public.custom_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_organizers_user_id ON public.organizers(user_id);
CREATE INDEX idx_organizers_slug ON public.organizers(slug);
CREATE INDEX idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_custom_links_organizer_id ON public.custom_links(organizer_id);
CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON public.event_registrations(user_id);