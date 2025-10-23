import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import EventDetails from "./EventDetails";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useEventPixels } from "@/hooks/useEventPixels";

// Helper to create URL-friendly slugs (same rules used in share)
const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

export default function EventPublicPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserOrganizer, setIsUserOrganizer] = useState(false);
  const { trackEvent } = useEventPixels(eventId);

  useEffect(() => {
    const resolveEvent = async () => {
      try {
        setLoading(true);

        // Se a URL é /e/:eventId, usar o ID diretamente
        if (params.eventId) {
          console.log('Usando ID direto do evento:', params.eventId);
          setEventId(params.eventId);

          // Check if logged user is the organizer
          if (user) {
            const { data: event } = await supabase
              .from('events')
              .select('organizer_id')
              .eq('id', params.eventId)
              .single();

            if (event) {
              const { data: organizer } = await supabase
                .from('organizers')
                .select('user_id, preferred_theme')
                .eq('id', event.organizer_id)
                .single();

              if (organizer) {
                if (organizer.user_id === user.id) {
                  setIsUserOrganizer(true);
                }

                // Aplicar tema do organizador
                const root = document.documentElement;
                root.classList.remove('dark', 'light');
                root.classList.add(organizer.preferred_theme || 'dark');
              }
            }
          }

          setLoading(false);
          return;
        }

        // Detectar formato da URL: organizador_evento ou organizador/evento
        let organizerSlug: string | undefined;
        let eventSlug: string | undefined;

        if (params.combinedSlug && params.combinedSlug.includes('_')) {
          // Formato: organizador_evento
          const parts = params.combinedSlug.split('_');
          organizerSlug = parts[0];
          eventSlug = parts.slice(1).join('_'); // Caso o nome do evento tenha underline
        } else if (params.organizerSlug && params.eventSlug) {
          // Formato: organizador/evento
          organizerSlug = params.organizerSlug;
          eventSlug = params.eventSlug;
        } else if (params.combinedSlug) {
          // Tentativa de dividir por último hífen se não tiver underline
          const lastHyphen = params.combinedSlug.lastIndexOf('-');
          if (lastHyphen > 0) {
            organizerSlug = params.combinedSlug.substring(0, lastHyphen);
            eventSlug = params.combinedSlug.substring(lastHyphen + 1);
          }
        }

        if (!organizerSlug || !eventSlug) {
          console.log('Não foi possível extrair organizador e evento da URL');
          setLoading(false);
          return;
        }

        console.log('Procurando evento:', { organizerSlug, eventSlug });

        // Try multiple strategies to resolve organizer
        let organizerId: string | null = null;
        let organizerTheme: string = 'dark';
        const deSlug = organizerSlug.replace(/-/g, ' ');

        // 1) Get all organizers with their profiles
        const { data: organizers, error: orgError } = await supabase
          .from("organizers")
          .select(`
            id,
            user_id,
            page_title,
            username,
            preferred_theme,
            profile:profiles!organizers_user_id_fkey(display_name)
          `);

        if (orgError) throw orgError;

        if (organizers && organizers.length > 0) {
          // Try to find best match
          for (const org of organizers) {
            const profileDisplayName = (org.profile as any)?.display_name || '';

            // Exact match by username
            if (org.username === organizerSlug) {
              organizerId = org.id;
              organizerTheme = org.preferred_theme || 'dark';
              console.log('Match found by username:', org.username);
              break;
            }

            // Match by slugified display_name
            if (slugify(profileDisplayName) === organizerSlug) {
              organizerId = org.id;
              organizerTheme = org.preferred_theme || 'dark';
              console.log('Match found by display_name:', profileDisplayName);
              break;
            }

            // Match by slugified page_title
            if (org.page_title && slugify(org.page_title) === organizerSlug) {
              organizerId = org.id;
              organizerTheme = org.preferred_theme || 'dark';
              console.log('Match found by page_title:', org.page_title);
              break;
            }
          }
        }

        if (!organizerId) {
          console.error('Nenhum organizador encontrado com slug:', organizerSlug);
          console.log('Organizadores disponíveis:', organizers?.map(o => ({
            username: o.username,
            page_title: o.page_title,
            display_name: (o.profile as any)?.display_name
          })));
          setLoading(false);
          toast.error("Organizador não encontrado");
          return;
        }

        // Aplicar tema do organizador
        const root = document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(organizerTheme);

        // Fetch this organizer's events and find by slugified title on the client (case-insensitive)
        const { data: events, error: eventsError } = await supabase
          .from("events")
          .select("id, title, organizer_id")
          .eq("organizer_id", organizerId);
        if (eventsError) throw eventsError;

        const targetSlug = eventSlug.toLowerCase();
        const match = (events || []).find((ev) => slugify(ev.title) === targetSlug);
        if (!match) {
          setLoading(false);
          toast.error("Evento não encontrado");
          return;
        }

        setEventId(match.id);

        // Check if logged user is the organizer
        if (user) {
          const { data: organizer } = await supabase
            .from('organizers')
            .select('user_id')
            .eq('id', match.organizer_id)
            .single();
          
          if (organizer && organizer.user_id === user.id) {
            setIsUserOrganizer(true);
          }
        }
      } catch (e) {
        console.error("Error resolving event by slug:", e);
        toast.error("Erro ao carregar evento");
      } finally {
        setLoading(false);
      }
    };

    resolveEvent();

    // Cleanup: restaurar tema ao sair da página
    return () => {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(savedTheme);
    };
  }, [params.organizerSlug, params.eventSlug, params.combinedSlug, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative">
          <Skeleton className="w-full h-80" />
        </div>
        <div className="px-4 py-6 max-w-md mx-auto space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Página não encontrada</p>
          <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EventDetails
      onBack={() => navigate("/")}
      eventId={eventId}
      onRegister={() => navigate(`/event/${eventId}/register`)}
      onManageRegistrations={isUserOrganizer ? () => navigate(`/event/${eventId}/registrations`) : undefined}
      onViewAttendances={isUserOrganizer ? () => navigate(`/event/${eventId}/attendances`) : undefined}
      onEdit={isUserOrganizer ? (id: string) => navigate(`/event/edit/${id}`) : undefined}
      onFindFriends={() => navigate(`/event/${eventId}/find-friends`)}
    />
  );
}
