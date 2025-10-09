-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin role to flatgrowth@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'flatgrowth@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create platform_events table (events created by admin)
CREATE TABLE public.platform_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT NOT NULL,
    location_link TEXT,
    image_url TEXT,
    organizer_name TEXT NOT NULL,
    category TEXT,
    max_attendees INTEGER,
    status TEXT DEFAULT 'upcoming',
    claimed_by_organizer_id UUID REFERENCES public.organizers(id),
    created_by_admin_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on platform_events
ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for platform_events
CREATE POLICY "Anyone can view platform events"
ON public.platform_events
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage platform events"
ON public.platform_events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create event_claim_requests table
CREATE TABLE public.event_claim_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_event_id UUID REFERENCES public.platform_events(id) ON DELETE CASCADE NOT NULL,
    organizer_id UUID REFERENCES public.organizers(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by_admin_id UUID,
    UNIQUE (platform_event_id, organizer_id)
);

-- Enable RLS on event_claim_requests
ALTER TABLE public.event_claim_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_claim_requests
CREATE POLICY "Organizers can create claim requests"
ON public.event_claim_requests
FOR INSERT
TO authenticated
WITH CHECK (
    organizer_id IN (
        SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Organizers can view their own requests"
ON public.event_claim_requests
FOR SELECT
TO authenticated
USING (
    organizer_id IN (
        SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all claim requests"
ON public.event_claim_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create support_messages table for admin support chat
CREATE TABLE public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_admin_reply BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    read BOOLEAN DEFAULT false
);

-- Enable RLS on support_messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_messages
CREATE POLICY "Users can view their own support messages"
ON public.support_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create support messages"
ON public.support_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all support messages"
ON public.support_messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create support replies"
ON public.support_messages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND is_admin_reply = true);

CREATE POLICY "Admins can update support messages"
ON public.support_messages
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));