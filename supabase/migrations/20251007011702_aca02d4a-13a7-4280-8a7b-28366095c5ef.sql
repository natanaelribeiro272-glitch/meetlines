-- Atualizar stats de todos os organizadores existentes
INSERT INTO public.organizer_stats (organizer_id, followers_count, events_count)
SELECT 
  o.id as organizer_id,
  COALESCE((SELECT COUNT(*) FROM public.followers WHERE organizer_id = o.id), 0) as followers_count,
  COALESCE((SELECT COUNT(*) FROM public.events WHERE organizer_id = o.id), 0) as events_count
FROM public.organizers o
ON CONFLICT (organizer_id) 
DO UPDATE SET 
  followers_count = EXCLUDED.followers_count,
  events_count = EXCLUDED.events_count,
  updated_at = now();