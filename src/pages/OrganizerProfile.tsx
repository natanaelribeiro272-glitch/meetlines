import { useState } from "react";
import { ArrowLeft, Users, ExternalLink, MessageCircle, Camera, Music, MapPin, Calendar, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

interface OrganizerProfileProps {
  onBack: () => void;
  organizerId?: string;
  onEventClick?: (eventId: string) => void;
}

export default function OrganizerProfile({ onBack, organizerId = "electronic-vibes", onEventClick }: OrganizerProfileProps) {
  const [activeTab, setActiveTab] = useState("eventos");
  const [requestText, setRequestText] = useState("");

  // Mock organizer data
  const organizer = {
    id: "electronic-vibes",
    name: "Electronic Vibes",
    avatar: "",
    bio: "Produtora de eventos eletrônicos underground em São Paulo. Criando experiências únicas desde 2018.",
    followers: 12500,
    following: 156,
    totalEvents: 47,
    hasLiveEvent: true,
    links: [
      { id: "1", title: "Instagram", url: "https://instagram.com/electronicvibes", icon: "📱" },
      { id: "2", title: "Spotify Playlist", url: "https://spotify.com/playlist", icon: "🎵" },
      { id: "3", title: "WhatsApp", url: "https://wa.me/11999999999", icon: "💬" },
      { id: "4", title: "Site Oficial", url: "https://electronicvibes.com", icon: "🌐" },
      { id: "5", title: "Grupo do Evento", url: "https://chat.whatsapp.com/grupo-evento", icon: "👥" }
    ],
    events: [
      {
        id: "1",
        title: "Festival Eletrônico Underground",
        image: event1,
        date: "Hoje, 22:00",
        location: "Warehouse District",
        isLive: true,
        attendees: 250
      },
      {
        id: "2",
        title: "Techno Night - Próxima Sexta",
        image: event2,
        date: "Sex, 23:00",
        location: "Club XYZ",
        isLive: false,
        attendees: 180
      },
      {
        id: "3",
        title: "Progressive House Session",
        image: event3,
        date: "Sáb, 20:00",
        location: "Rooftop Sky",
        isLive: false,
        attendees: 120
      }
    ],
    photos: [
      { id: "1", url: event1, caption: "Festival Underground 2024" },
      { id: "2", url: event2, caption: "Noite Techno" },
      { id: "3", url: event3, caption: "Progressive Session" },
      { id: "4", url: event1, caption: "Público incrível" },
      { id: "5", url: event2, caption: "Setup completo" },
      { id: "6", url: event3, caption: "Energia pura" }
    ],
    playlists: [
      { id: "1", title: "Underground Hits 2024", tracks: 45, cover: event1 },
      { id: "2", title: "Techno Essentials", tracks: 32, cover: event2 },
      { id: "3", title: "Progressive Journey", tracks: 28, cover: event3 }
    ]
  };

  const handleRequestSubmit = () => {
    if (requestText.trim()) {
      // Mock submit
      setRequestText("");
      // Show success toast or feedback
    }
  };

  const tabs = [
    { id: "eventos", label: "Eventos", icon: Calendar },
    { id: "links", label: "Links", icon: ExternalLink },
    { id: "fotos", label: "Fotos", icon: Camera }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-primary/20 to-background">
        <div className="flex items-center gap-4 p-4 relative z-10">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Organizador</h1>
        </div>

        {/* Profile Header */}
        <div className="px-4 pb-6 text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-background shadow-lg">
            <AvatarImage src={organizer.avatar} alt={organizer.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {organizer.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">{organizer.name}</h2>
          <p className="text-muted-foreground max-w-sm mx-auto mb-4">{organizer.bio}</p>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{organizer.followers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{organizer.totalEvents}</p>
              <p className="text-sm text-muted-foreground">Eventos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{organizer.following}</p>
              <p className="text-sm text-muted-foreground">Seguindo</p>
            </div>
          </div>

          {/* Follow button */}
          <div className="flex justify-center">
            <Button variant="glow" size="lg">
              Seguir
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 justify-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 max-w-md mx-auto">
        {/* Eventos Tab */}
        {activeTab === "eventos" && (
          <div className="space-y-4">
            {organizer.events.map((event) => (
              <Card 
                key={event.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onEventClick?.(event.id)}
              >
                <div className="relative">
                  <img src={event.image} alt={event.title} className="w-full h-32 object-cover" />
                  {event.isLive && (
                    <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
                      <div className="h-2 w-2 bg-white rounded-full animate-pulse mr-1" />
                      AO VIVO
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-3 w-3" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{event.location}</span>
                    <Users className="h-3 w-3 ml-auto" />
                    <span>{event.attendees}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && (
          <div className="space-y-3">
            {organizer.links.map((link) => (
              <Card key={link.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{link.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{link.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Fotos Tab */}
        {activeTab === "fotos" && (
          <div className="grid grid-cols-2 gap-3">
            {organizer.photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group">
                <img 
                  src={photo.url} 
                  alt={photo.caption} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-xs truncate">{photo.caption}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}