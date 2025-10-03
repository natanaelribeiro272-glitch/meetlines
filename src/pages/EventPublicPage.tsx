import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import EventDetails from "./EventDetails";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
  const { organizerSlug, eventSlug } = useParams();
  const navigate = useNavigate();
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveEvent = async () => {
      try {
        setLoading(true);
        if (!organizerSlug || !eventSlug) {
          setLoading(false);
          return;
        }

        // 1) Find organizer by slug (organizers table already has a slug column)
        const { data: organizer, error: orgError } = await supabase
          .from("organizers")
          .select("id, page_title, user_id")
          .eq("slug", organizerSlug)
          .maybeSingle();

        if (orgError) throw orgError;
        if (!organizer) {
          setLoading(false);
          toast.error("Organizador não encontrado");
          return;
        }

        // 2) Fetch this organizer's events and find by slugified title on the client
        const { data: events, error: eventsError } = await supabase
          .from("events")
          .select("id, title, organizer_id")
          .eq("organizer_id", organizer.id);

        if (eventsError) throw eventsError;

        const match = (events || []).find((ev) => slugify(ev.title) === eventSlug);
        if (!match) {
          setLoading(false);
          toast.error("Evento não encontrado");
          return;
        }

        setEventId(match.id);
      } catch (e) {
        console.error("Error resolving event by slug:", e);
        toast.error("Erro ao carregar evento");
      } finally {
        setLoading(false);
      }
    };

    resolveEvent();
  }, [organizerSlug, eventSlug]);

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
      onRegister={() => navigate("/")}
      onFindFriends={() => navigate("/")}
    />
  );
}
