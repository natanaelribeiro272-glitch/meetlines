import { useState } from "react";
import { EventCard } from "./EventCard";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

interface Event {
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
  category?: string;
  requiresRegistration?: boolean;
  isOwnEvent?: boolean;
}

const mockEvents: Event[] = [
  // Festas
  {
    id: "2", 
    title: "Rooftop Party - Vista da Cidade",
    image: event2,
    organizerName: "Urban Events",
    date: "Sáb, 19:00",
    location: "Cobertura Infinity, Vila Madalena",
    estimatedAttendees: 80,
    likes: 156,
    comments: 45,
    isLiked: true,
    isLive: false,
    price: 85,
    category: "festas"
  },
  {
    id: "4",
    title: "Festa Tropical no Clube",
    image: event1,
    organizerName: "Tropical Nights",
    date: "Sex, 21:00",
    location: "Clube Paradise, Moema",
    estimatedAttendees: 300,
    likes: 234,
    comments: 67,
    isLiked: false,
    isLive: false,
    price: 60,
    category: "festas"
  },
  {
    id: "5",
    title: "Festa de Formatura UFRJ",
    image: event3,
    organizerName: "Formandos 2024",
    date: "Ter, 20:00",
    location: "Salão Nobre, Copacabana",
    estimatedAttendees: 150,
    likes: 89,
    comments: 23,
    isLiked: true,
    isLive: false,
    price: 120,
    category: "festas"
  },
  {
    id: "6",
    title: "Halloween Party Especial",
    image: event2,
    organizerName: "Spooky Events",
    date: "Qui, 22:00",
    location: "Casa Assombrada, Centro",
    estimatedAttendees: 200,
    likes: 145,
    comments: 34,
    isLiked: false,
    isLive: false,
    price: 45,
    category: "festas"
  },
  // Encontros
  {
    id: "7",
    title: "Exposição de Arte Contemporânea",
    image: event3, 
    organizerName: "Galeria Moderna",
    date: "Dom, 15:00",
    location: "Galeria Moderna, Pinheiros",
    estimatedAttendees: 120,
    likes: 67,
    comments: 12,
    isLiked: false,
    isLive: false,
    category: "encontros",
    requiresRegistration: true,
    isOwnEvent: false
  },
  {
    id: "8",
    title: "Networking de Empreendedores",
    image: event1,
    organizerName: "StartupSP",
    date: "Qua, 18:00",
    location: "Hub de Inovação, Faria Lima",
    estimatedAttendees: 80,
    likes: 92,
    comments: 18,
    isLiked: true,
    isLive: false,
    category: "encontros",
    requiresRegistration: true,
    isOwnEvent: false
  },
  {
    id: "9",
    title: "Clube do Livro - Discussão",
    image: event2,
    organizerName: "BookLovers SP",
    date: "Seg, 19:00",
    location: "Café Literário, Vila Madalena",
    estimatedAttendees: 25,
    likes: 34,
    comments: 8,
    isLiked: false,
    isLive: false,
    category: "encontros"
  }
];

interface EventFeedProps {
  onEventClick: (eventId: string) => void;
  onOrganizerClick: (organizerId: string) => void;
  userType?: "user" | "organizer";
}

export function EventFeed({ onEventClick, onOrganizerClick, userType = "user" }: EventFeedProps) {
  const [events, setEvents] = useState<Event[]>(mockEvents);

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

  const handleEventClick = (eventId: string) => {
    onEventClick(eventId);
  };

  const categorizeEvents = () => {
    const festas = events.filter(event => event.category === "festas");
    const encontros = events.filter(event => event.category === "encontros");
    
    return { festas, encontros };
  };

  const { festas, encontros } = categorizeEvents();

  return (
    <div className="space-y-8">
      {/* Festas */}
      {festas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 px-1">🎉 Festas</h2>
          <div className="space-y-6">
            {festas.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                onClick={() => handleEventClick(event.id)}
                onLike={() => handleLike(event.id)}
                onOrganizerClick={() => onOrganizerClick("electronic-vibes")}
                userType={userType}
                onRegister={() => onEventClick("register")}
                onManageRegistrations={() => onEventClick("registrations")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Encontros */}
      {encontros.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 px-1">🤝 Encontros</h2>
          <div className="space-y-6">
            {encontros.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                onClick={() => handleEventClick(event.id)}
                onLike={() => handleLike(event.id)}
                onOrganizerClick={() => onOrganizerClick("galeria-moderna")}
                userType={userType}
                onRegister={() => onEventClick("register")}
                onManageRegistrations={() => onEventClick("registrations")}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}