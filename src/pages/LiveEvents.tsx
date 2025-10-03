import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { useEvents } from "@/hooks/useEvents";

interface LiveEventsProps {
  onBack: () => void;
  onEventClick: (eventId: string) => void;
}

export default function LiveEvents({ onBack, onEventClick }: LiveEventsProps) {
  const { events, loading, toggleLike } = useEvents();
  
  // Filter only live events
  const liveEvents = events.filter(event => event.is_live);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex items-center gap-4 p-4 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Eventos ao Vivo</h1>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Eventos ao Vivo</h1>
          <p className="text-sm text-muted-foreground">
            {liveEvents.length > 0 ? "Acontecendo agora" : "Nenhum evento ao vivo no momento"}
          </p>
        </div>
      </div>

      <main className="px-4 py-6 max-w-md mx-auto">
        {liveEvents.length > 0 ? (
          <div className="space-y-6">
            {liveEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                image={event.image_url || ""}
                organizerName={event.organizer?.page_title || "Organizador"}
                organizerAvatar={event.organizer?.profile?.avatar_url || ""}
                date={new Date(event.event_date).toLocaleDateString('pt-BR')}
                location={event.location}
                locationLink={event.location_link || undefined}
                estimatedAttendees={event.current_attendees || 0}
                likes={event.likes_count || 0}
                comments={event.comments_count || 0}
                isLiked={event.is_liked || false}
                isLive={event.is_live}
                onClick={() => onEventClick(event.id)}
                onLike={() => toggleLike(event.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum evento ao vivo no momento</p>
            <p className="text-sm text-muted-foreground mt-2">Volte mais tarde para ver eventos acontecendo</p>
          </div>
        )}
      </main>
    </div>
  );
}