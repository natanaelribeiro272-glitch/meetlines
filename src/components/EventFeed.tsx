import { EventCard } from "./EventCard";
import { useEvents } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { EventFilters } from "@/components/EventFiltersDialog";

// Função auxiliar para formatizar data
const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${dayName}, ${day} ${month}, ${hours}:${minutes}`;
};

const formatEndDate = (dateString: string | null) => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${dayName}, ${day} ${month}, ${hours}:${minutes}`;
};

interface EventFeedProps {
  onEventClick: (eventId: string) => void;
  onOrganizerClick: (organizerId: string) => void;
  userType?: "user" | "organizer";
  categoryFilter?: string;
  searchQuery?: string;
  userInterests?: string[];
  filters?: EventFilters;
}

export function EventFeed({ onEventClick, onOrganizerClick, userType = "user", categoryFilter, searchQuery, userInterests, filters }: EventFeedProps) {
  const { events, loading, toggleLike } = useEvents(categoryFilter, searchQuery, userInterests, filters);

  const handleEventClick = (eventId: string) => {
    onEventClick(eventId);
  };

  const categorizeEvents = () => {
    const now = new Date();
    
    // Eventos ao vivo: começaram mas ainda não terminaram
    const live = events.filter(event => {
      const start = new Date(event.event_date);
      const end = event.end_date ? new Date(event.end_date) : null;
      const isCompleted = (event.status || '').toLowerCase() === 'completed' || (event.status || '').toLowerCase() === 'ended';
      return start <= now && !isCompleted && (!end || end > now);
    });
    
    // Próximos eventos: ainda não começaram
    const upcoming = events.filter(event => {
      const start = new Date(event.event_date);
      const isCompleted = (event.status || '').toLowerCase() === 'completed' || (event.status || '').toLowerCase() === 'ended';
      return start > now && !isCompleted;
    });
    
    return { upcoming, live };
  };

  const { upcoming, live } = categorizeEvents();

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Eventos ao Vivo */}
      {live.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 px-1">🔴 Acontecendo Agora</h2>
          <div className="space-y-6">
            {live.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                image={event.image_url || ''}
                organizerName={event.organizer?.profile?.display_name || event.organizer?.page_title || 'Organizador'}
                organizerAvatar={event.organizer?.profile?.avatar_url}
                date={formatEventDate(event.event_date)}
                endDate={formatEndDate(event.end_date)}
                location={event.location}
                locationLink={event.location_link || undefined}
                ticketLink={event.ticket_link || undefined}
                estimatedAttendees={event.unique_attendees_count || 0}
                likes={event.likes_count || 0}
                comments={event.comments_count || 0}
                isLiked={event.is_liked || false}
                isLive={(() => { const start = new Date(event.event_date); const end = event.end_date ? new Date(event.end_date) : null; const now = new Date(); return start <= now && (!end || end > now); })()}
                price={event.ticket_price || 0}
                hasPaidTickets={event.has_paid_tickets}
                onClick={() => handleEventClick(event.id)}
                onLike={() => toggleLike(event.id)}
                onOrganizerClick={() => {
                  console.log('Organizador clicado:', event.organizer);
                  onOrganizerClick(event.organizer?.id || '');
                }}
                userType={userType}
                onRegister={() => onEventClick("register")}
                onManageRegistrations={() => onEventClick("registrations")}
                isPlatformEvent={event.is_platform_event || false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Próximos Eventos */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 px-1">📅 Próximos Eventos</h2>
          <div className="space-y-6">
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                image={event.image_url || ''}
                organizerName={event.organizer?.profile?.display_name || event.organizer?.page_title || 'Organizador'}
                organizerAvatar={event.organizer?.profile?.avatar_url}
                date={formatEventDate(event.event_date)}
                endDate={formatEndDate(event.end_date)}
                location={event.location}
                locationLink={event.location_link || undefined}
                ticketLink={event.ticket_link || undefined}
                estimatedAttendees={event.unique_attendees_count || 0}
                likes={event.likes_count || 0}
                comments={event.comments_count || 0}
                isLiked={event.is_liked || false}
                isLive={false}
                price={event.ticket_price || 0}
                hasPaidTickets={event.has_paid_tickets}
                onClick={() => handleEventClick(event.id)}
                onLike={() => toggleLike(event.id)}
                onOrganizerClick={() => {
                  console.log('Organizador clicado:', event.organizer);
                  onOrganizerClick(event.organizer?.id || '');
                }}
                userType={userType}
                onRegister={() => onEventClick("register")}
                onManageRegistrations={() => onEventClick("registrations")}
                isPlatformEvent={event.is_platform_event || false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há eventos */}
      {events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum evento encontrado</p>
        </div>
      )}
    </div>
  );
}