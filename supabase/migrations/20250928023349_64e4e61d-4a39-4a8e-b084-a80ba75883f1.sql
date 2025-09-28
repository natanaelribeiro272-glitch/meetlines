-- Adicionar foreign key constraint para organizer_stats
ALTER TABLE public.organizer_stats 
ADD CONSTRAINT organizer_stats_organizer_id_fkey 
FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE CASCADE;