-- Add attendance_confirmed field to event_registrations table
ALTER TABLE public.event_registrations
ADD COLUMN attendance_confirmed boolean DEFAULT false,
ADD COLUMN attendance_confirmed_at timestamp with time zone;

-- Add index for better query performance
CREATE INDEX idx_event_registrations_attendance ON public.event_registrations(event_id, attendance_confirmed) WHERE attendance_confirmed = true;

-- Add comment
COMMENT ON COLUMN public.event_registrations.attendance_confirmed IS 'Indicates if the user confirmed their physical presence at the event';
COMMENT ON COLUMN public.event_registrations.attendance_confirmed_at IS 'Timestamp when the user confirmed their attendance';