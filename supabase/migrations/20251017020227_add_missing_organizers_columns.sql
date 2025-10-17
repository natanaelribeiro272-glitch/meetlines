/*
  # Adicionar colunas faltantes na tabela organizers
  
  1. Novas colunas:
    - username: substitui slug (será renomeado depois)
    - whatsapp_url, instagram_url, playlist_url, location_url, website_url: URLs de contato
    - show_whatsapp, show_instagram, show_playlist, show_location, show_website: flags de visibilidade
    - notify_new_registrations: notificar novas inscrições
    - notify_event_reminders: notificar lembretes de eventos
    - public_page_visible: visibilidade da página pública
    - preferred_theme: tema preferido (dark/light)
  
  2. Observações:
    - Algumas colunas já podem existir, por isso usamos IF NOT EXISTS
*/

ALTER TABLE public.organizers
ADD COLUMN IF NOT EXISTS whatsapp_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS playlist_url text,
ADD COLUMN IF NOT EXISTS location_url text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS show_whatsapp boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_instagram boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_playlist boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_location boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_website boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_new_registrations boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_event_reminders boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS public_page_visible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS preferred_theme text DEFAULT 'dark' CHECK (preferred_theme IN ('dark', 'light'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizers' 
    AND column_name = 'slug'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizers' 
    AND column_name = 'username'
  ) THEN
    ALTER TABLE public.organizers RENAME COLUMN slug TO username;
    
    COMMENT ON COLUMN public.organizers.username IS 'Unique username (like Instagram @handle). Cannot be changed after creation. Used in public URLs.';
  END IF;
END $$;

COMMENT ON COLUMN public.organizers.category IS 'Categoria do organizador: festas, eventos, encontros, lives, geek, esporte, saúde, igreja, outro';