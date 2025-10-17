import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import EventDetails from "./EventDetails";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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

  useEffect(() => {
    const resolveEvent = async () => {
      try {
        setLoading(true);

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

        // 1) Exact match by organizers.username
        const { data: orgByUsername, error: orgError } = await supabase
          .from("organizers")
          .select("id, page_title, user_id, preferred_theme")
          .eq("username", organizerSlug)
          .maybeSingle();
        if (orgError) throw orgError;
        if (orgByUsername) {
          organizerId = orgByUsername.id;
          organizerTheme = orgByUsername.preferred_theme || 'dark';
        }

        // 2) Match by profiles.display_name (user-friendly name used in share)
        if (!organizerId) {
          const { data: profileMatch, error: profileErr } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .ilike("display_name", `%${deSlug}%`)
            .maybeSingle();
          if (profileErr && profileErr.code !== 'PGRST116') throw profileErr; // ignore no rows
          if (profileMatch) {
            const { data: orgByUser, error: orgByUserErr } = await supabase
              .from("organizers")
              .select("id, user_id, preferred_theme")
              .eq("user_id", profileMatch.user_id)
              .maybeSingle();
            if (orgByUserErr && orgByUserErr.code !== 'PGRST116') throw orgByUserErr;
            if (orgByUser) {
              organizerId = orgByUser.id;
              organizerTheme = orgByUser.preferred_theme || 'dark';
            }
          }
        }

        // 3) Fallback: match by organizers.page_title (approximate)
        if (!organizerId) {
          const { data: orgByTitle, error: orgByTitleErr } = await supabase
            .from("organizers")
            .select("id, page_title, preferred_theme")
            .ilike("page_title", `%${deSlug}%`)
            .maybeSingle();
          if (orgByTitleErr && orgByTitleErr.code !== 'PGRST116') throw orgByTitleErr;
          if (orgByTitle) {
            organizerId = orgByTitle.id;
            organizerTheme = orgByTitle.preferred_theme || 'dark';
          }
        }

        if (!organizerId) {
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
