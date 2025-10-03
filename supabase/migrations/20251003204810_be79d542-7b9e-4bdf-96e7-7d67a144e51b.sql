-- Allow users to view confirmed attendees of events they also confirmed attendance for
DROP POLICY IF EXISTS "Users can view confirmed attendees in same event" ON public.event_registrations;

CREATE POLICY "Users can view confirmed attendees in same event"
ON public.event_registrations
FOR SELECT
USING (
  attendance_confirmed = true
  AND EXISTS (
    SELECT 1 FROM public.event_registrations er2
    WHERE er2.event_id = event_registrations.event_id
      AND er2.user_id = auth.uid()
      AND er2.attendance_confirmed = true
  )
);

-- Performance index to speed up lookups of confirmed attendees per event
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_confirmed
ON public.event_registrations (event_id)
WHERE attendance_confirmed = true;