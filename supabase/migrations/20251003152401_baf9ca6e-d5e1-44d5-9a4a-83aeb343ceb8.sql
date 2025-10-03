-- Enable realtime for profiles and organizers
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.organizers REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.organizers;