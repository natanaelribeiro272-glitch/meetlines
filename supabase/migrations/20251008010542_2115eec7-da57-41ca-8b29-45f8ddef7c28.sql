-- Add category field to organizers table
ALTER TABLE public.organizers 
ADD COLUMN category text;

-- Add a comment to describe the column
COMMENT ON COLUMN public.organizers.category IS 'Categoria do organizador: festas, eventos, encontros, lives, geek, esporte, saúde, igreja, outro';