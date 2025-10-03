-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view confirmed attendees in same event" ON public.event_registrations;

-- Create security definer function to check if user has confirmed attendance
CREATE OR REPLACE FUNCTION public.user_confirmed_attendance_in_event(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_registrations
    WHERE user_id = _user_id
      AND event_id = _event_id
      AND attendance_confirmed = true
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view confirmed attendees in same event"
ON public.event_registrations
FOR SELECT
USING (
  attendance_confirmed = true
  AND public.user_confirmed_attendance_in_event(auth.uid(), event_id)
);