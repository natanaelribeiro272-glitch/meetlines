-- Add settings columns to organizers table
ALTER TABLE public.organizers
ADD COLUMN IF NOT EXISTS notify_new_registrations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_event_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS public_page_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_statistics BOOLEAN DEFAULT true;