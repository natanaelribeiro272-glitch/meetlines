-- Add form_fields column to events table to store custom registration form configuration
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS form_fields JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.events.form_fields IS 'Custom form fields configuration for event registration';