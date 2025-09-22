import { useState } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

interface LiveEvent {
  id: string;
  title: string;
  image: string;
  organizerName: string;
  organizerAvatar?: string;
  date: string;
  location: string;
  estimatedAttendees: number;
  likes: number;
  comments: number;
  isLiked: boolean;
  isLive: boolean;
  price?: number;
}

const liveEvents: LiveEvent[] = [
  {
    id: "1",
    title: "Festival Eletrônico Underground",
    image: event1,
    organizerName: "Electronic Vibes",
    date: "Hoje, 22:00",
    location: "Warehouse District, São Paulo",
    estimatedAttendees: 250,
    likes: 89,
    comments: 23,
    isLiked: false,
    isLive: true,
  },
  {
    id: "live-2",
    title: "Show de Jazz ao Vivo",
    image: event2,
    organizerName: "Jazz Club SP",
    date: "Agora mesmo",
    location: "Blue Note, Vila Madalena",
    estimatedAttendees: 120,
    likes: 156,
    comments: 45,
    isLiked: true,
    isLive: true,
  },
  {
    id: "live-3",
    title: "Batalha de Rap - Final",
    image: event3,
    organizerName: "Rap Battles BR",
    date: "Iniciando em 15min",
    location: "Praça Roosevelt, Centro",
    estimatedAttendees: 300,
    likes: 234,
    comments: 67,
    isLiked: false,
    isLive: true,
  }
];

interface LiveEventsProps {
  onBack: () => void;
  onEventClick: (eventId: string) => void;
}

export default function LiveEvents({ onBack, onEventClick }: LiveEventsProps) {
  const [events, setEvents] = useState<LiveEvent[]>(liveEvents);

  const handleLike = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            isLiked: !event.isLiked,
            likes: event.isLiked ? event.likes - 1 : event.likes + 1
          }
        : event
    ));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Eventos ao Vivo</h1>
          <p className="text-sm text-muted-foreground">Acontecendo agora</p>
        </div>
      </div>

      <main className="px-4 py-6 max-w-md mx-auto">
        <div className="space-y-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              {...event}
              onClick={() => onEventClick(event.id)}
              onLike={() => handleLike(event.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}