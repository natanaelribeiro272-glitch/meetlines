-- Drop the existing check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new check constraint with user_like type
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('event_created', 'event_updated', 'event_cancelled', 'user_like', 'follower'));