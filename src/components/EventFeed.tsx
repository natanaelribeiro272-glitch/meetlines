import { EventCard } from "./EventCard";
import { useEvents } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";

// Função auxiliar para formatizar data
const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayName = days[date.getDay()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${dayName}, ${hours}:${minutes}`;
};

const formatEndDate = (dateString: string | null) => {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayName = days[date.getDay()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${dayName}, ${hours}:${minutes}`;
};

interface EventFeedProps {
  onEventClick: (eventId: string) => void;
  onOrganizerClick: (organizerId: string) => void;
  userType?: "user" | "organizer";
  categoryFilter?: string;
  searchQuery?: string;
}

export function EventFeed({ onEventClick, onOrganizerClick, userType = "user", categoryFilter, searchQuery }: EventFeedProps) {
  const { events, loading, toggleLike } = useEvents(categoryFilter, searchQuery);

  const handleEventClick = (eventId: string) => {
    onEventClick(eventId);
  };

  const categorizeEvents = () => {
    const now = new Date();
    
    // Eventos ao vivo: data do evento já passou ou está acontecendo agora
    const live = events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate <= now;
    });
    
    // Próximos eventos: data do evento ainda não chegou
    const upcoming = events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate > now;
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
                image={event.image_url || '/placeholder.svg'}
                organizerName={event.organizer?.profile?.display_name || event.organizer?.page_title || 'Organizador'}
                organizerAvatar={event.organizer?.profile?.avatar_url}
                date={formatEventDate(event.event_date)}
                endDate={formatEndDate(event.end_date)}
                location={event.location}
                locationLink={event.location_link || undefined}
                estimatedAttendees={(event.registrations_count || 0) + (event.confirmed_attendees_count || 0)}
                likes={event.likes_count || 0}
                comments={event.comments_count || 0}
                isLiked={event.is_liked || false}
                isLive={true}
                onClick={() => handleEventClick(event.id)}
                onLike={() => toggleLike(event.id)}
                onOrganizerClick={() => onOrganizerClick(event.organizer?.id || '')}
                userType={userType}
                onRegister={() => onEventClick("register")}
                onManageRegistrations={() => onEventClick("registrations")}
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
                image={event.image_url || '/placeholder.svg'}
                organizerName={event.organizer?.profile?.display_name || event.organizer?.page_title || 'Organizador'}
                organizerAvatar={event.organizer?.profile?.avatar_url}
                date={formatEventDate(event.event_date)}
                endDate={formatEndDate(event.end_date)}
                location={event.location}
                locationLink={event.location_link || undefined}
                estimatedAttendees={(event.registrations_count || 0) + (event.confirmed_attendees_count || 0)}
                likes={event.likes_count || 0}
                comments={event.comments_count || 0}
                isLiked={event.is_liked || false}
                isLive={false}
                onClick={() => handleEventClick(event.id)}
                onLike={() => toggleLike(event.id)}
                onOrganizerClick={() => onOrganizerClick(event.organizer?.id || '')}
                userType={userType}
                onRegister={() => onEventClick("register")}
                onManageRegistrations={() => onEventClick("registrations")}
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