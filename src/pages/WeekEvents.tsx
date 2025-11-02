import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { useEvents } from "@/hooks/useEvents";



export default function WeekEvents() {
  const navigate = useNavigate();
  const { events, loading, toggleLike } = useEvents();

  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);

  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.event_date);
    const isCompleted = (event.status || '').toLowerCase() === 'completed' || (event.status || '').toLowerCase() === 'ended';
    return eventDate >= now && eventDate <= endOfWeek && !isCompleted;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex items-center gap-4 p-4 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Eventos da Semana</h1>
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
      <div className="flex items-center gap-4 p-4 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Eventos da Semana</h1>
          <p className="text-sm text-muted-foreground">
            {weekEvents.length > 0 ? `${weekEvents.length} evento${weekEvents.length > 1 ? 's' : ''} nos próximos 7 dias` : "Nenhum evento programado para esta semana"}
          </p>
        </div>
      </div>

      <main className="px-4 py-6 max-w-md mx-auto">
        {weekEvents.length > 0 ? (
          <div className="space-y-6">
            {weekEvents.map((event) => (
              <EventCard
                key={event.id}
                eventId={event.id}
                organizerName={event.organizer?.page_title || event.organizer_name || "Organizador"}
                organizerAvatar={event.organizer?.avatar_url || event.organizer?.profile?.avatar_url}
                date={new Date(event.event_date).toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                endDate={event.end_date ? new Date(event.end_date).toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : undefined}
                title={event.title}
                imageUrl={event.image_url}
                location={event.location}
                likesCount={event.likes_count || 0}
                commentsCount={event.comments_count || 0}
                viewsCount={event.registrations_count || 0}
                isLiked={event.is_liked || false}
                isLive={event.is_live}
                onClick={() => onEventClick(event.id)}
                onLike={() => toggleLike(event.id, event.is_liked || false)}
                onOrganizerClick={(organizerId) => navigate(`/organizador/${organizerId}/perfil`)}
                isPlatformEvent={event.is_platform_event}
                hasPaidTickets={event.has_paid_tickets}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">Nenhum evento programado</p>
            <p className="text-sm text-muted-foreground">Volte em breve para conferir novos eventos</p>
          </div>
        )}
      </main>
    </div>
  );
}
