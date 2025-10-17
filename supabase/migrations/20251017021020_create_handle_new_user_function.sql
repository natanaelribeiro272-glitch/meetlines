/*
  # Criar função para tratar novos usuários
  
  1. Função criada:
    - handle_new_user: cria automaticamente um profile quando um usuário se registra
  
  2. Trigger criado:
    - on_auth_user_created: dispara a função quando um usuário é criado
  
  3. Comportamento:
    - Cria um profile com user_id, display_name do metadata
    - Define role como 'user' por padrão (pode ser mudado depois)
*/

-- Função para criar profile automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role)
  );
  RETURN NEW;
END;
$$;

-- Criar trigger para chamar a função quando um usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Adicionar triggers de updated_at para tabelas que ainda não têm
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizers_updated_at ON public.organizers;
CREATE TRIGGER update_organizers_updated_at
  BEFORE UPDATE ON public.organizers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_links_updated_at ON public.custom_links;
CREATE TRIGGER update_custom_links_updated_at
  BEFORE UPDATE ON public.custom_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON public.event_registrations;
CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_comments_updated_at ON public.event_comments;
CREATE TRIGGER update_event_comments_updated_at
  BEFORE UPDATE ON public.event_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizer_stats_updated_at ON public.organizer_stats;
CREATE TRIGGER update_organizer_stats_updated_at
  BEFORE UPDATE ON public.organizer_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizer_photos_updated_at ON public.organizer_photos;
CREATE TRIGGER update_organizer_photos_updated_at
  BEFORE UPDATE ON public.organizer_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_messages_updated_at ON public.user_messages;
CREATE TRIGGER update_user_messages_updated_at
  BEFORE UPDATE ON public.user_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_events_updated_at ON public.platform_events;
CREATE TRIGGER update_platform_events_updated_at
  BEFORE UPDATE ON public.platform_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_ticket_settings_updated_at ON public.event_ticket_settings;
CREATE TRIGGER update_event_ticket_settings_updated_at
  BEFORE UPDATE ON public.event_ticket_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ticket_types_updated_at ON public.ticket_types;
CREATE TRIGGER update_ticket_types_updated_at
  BEFORE UPDATE ON public.ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizer_payouts_updated_at ON public.organizer_payouts;
CREATE TRIGGER update_organizer_payouts_updated_at
  BEFORE UPDATE ON public.organizer_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();