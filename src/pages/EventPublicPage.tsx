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

        // Se a URL é /evento/:slug, buscar pelo slug
        if (params.slug) {
          console.log('Buscando evento pelo slug:', params.slug);
          const { data: event, error } = await supabase
            .from('events')
            .select('id, organizer_id')
            .eq('slug', params.slug)
            .maybeSingle();

          if (error) {
            console.error('Erro ao buscar evento:', error);
            setLoading(false);
            return;
          }

          if (!event) {
            console.log('Evento não encontrado com slug:', params.slug);
            setLoading(false);
            return;
          }

          setEventId(event.id);

          // Check if logged user is the organizer
          if (user) {
            const { data: organizer } = await supabase
              .from('organizers')
              .select('user_id, preferred_theme')
              .eq('id', event.organizer_id)
              .maybeSingle();

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

          setLoading(false);
          return;
        }

        // Se a URL é /e/:eventId, usar o ID diretamente (fallback)
        if (params.eventId) {
          console.log('Usando ID direto do evento:', params.eventId);
          setEventId(params.eventId);

          // Check if logged user is the organizer
          if (user) {
            const { data: event } = await supabase
              .from('events')
              .select('organizer_id')
              .eq('id', params.eventId)
              .maybeSingle();

            if (event) {
              const { data: organizer } = await supabase
                .from('organizers')
                .select('user_id, preferred_theme')
                .eq('id', event.organizer_id)
                .maybeSingle();

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

        console.log('Formato de URL não reconhecido');
        setLoading(false);
        return;
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
  }, [params.slug, params.eventId, user]);

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
