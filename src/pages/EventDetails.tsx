import { ArrowLeft, MapPin, Users, Heart, MessageCircle, Share2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

interface EventDetailsProps {
  onBack: () => void;
  eventId: string | null;
  onRegister?: () => void;
  onFindFriends?: () => void;
}

export default function EventDetails({ onBack, eventId, onRegister, onFindFriends }: EventDetailsProps) {
  // Mock data based on eventId
  const getEventData = (id: string | null) => {
    // Events that require registration
    const requiresRegistration = id === "7" || id === "8" || id === "register";
    
    // Live events
    const isLive = id === "1" || id === "live-2" || id === "live-3" || id?.startsWith("live-");
    
    // Different event data based on ID
    switch(id) {
      case "7":
        return {
          title: "Exposição de Arte Contemporânea",
          image: event3,
          organizerName: "Galeria Moderna",
          date: "Dom, 15:00",
          location: "Galeria Moderna, Pinheiros",
          fullAddress: "Rua dos Pinheiros, 789 - Pinheiros, São Paulo - SP",
          estimatedAttendees: 120,
          likes: 67,
          comments: 12,
          isLiked: false,
          description: "Uma exposição exclusiva com obras de artistas contemporâneos brasileiros e internacionais. A mostra apresenta diferentes técnicas e estilos da arte atual.",
          isLive,
          requiresRegistration
        };
      
      case "8":
        return {
          title: "Networking de Empreendedores",
          image: event1,
          organizerName: "StartupSP",
          date: "Qua, 18:00",
          location: "Hub de Inovação, Faria Lima",
          fullAddress: "Av. Faria Lima, 1234 - Itaim Bibi, São Paulo - SP",
          estimatedAttendees: 80,
          likes: 92,
          comments: 18,
          isLiked: true,
          description: "Encontro mensal para empreendedores trocarem experiências, networking e oportunidades de negócios. Palestras com investidores e cases de sucesso.",
          isLive,
          requiresRegistration
        };
      
      case "2":
        return {
          title: "Rooftop Party - Vista da Cidade",
          image: event2,
          organizerName: "Urban Events",
          date: "Sáb, 19:00",
          location: "Cobertura Infinity, Vila Madalena",
          fullAddress: "Rua Harmonia, 456 - Vila Madalena, São Paulo - SP",
          estimatedAttendees: 80,
          likes: 156,
          comments: 45,
          isLiked: true,
          description: "Uma festa exclusiva na cobertura com vista panorâmica da cidade. DJ sets especiais, drinks autorais e ambiente sofisticado.",
          isLive,
          requiresRegistration: false
        };
      
      default:
        return {
          title: "Festival Eletrônico Underground",
          image: event1,
          organizerName: "Electronic Vibes",
          date: "Hoje, 22:00 - 04:00",
          location: "Warehouse District, Parauapebas",
          fullAddress: "Rua Augusta, 1234 - Centro, Parauapebas - PA",
          estimatedAttendees: 250,
          likes: 89,
          comments: 23,
          isLiked: false,
          description: "Uma noite épica de música eletrônica underground com os melhores DJs da cena local. Ambiente industrial, som de alta qualidade e uma experiência inesquecível.",
          isLive,
          requiresRegistration
        };
    }
  };

  const event = getEventData(eventId);

  const comments = [
    {
      id: "1",
      user: "Marina Silva",
      avatar: "",
      text: "Não vejo a hora! 🔥",
      time: "2h",
    },
    {
      id: "2", 
      user: "João Costa",
      avatar: "",
      text: "Lineup incrível, vou estar lá!",
      time: "4h",
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-80 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-surface/80 backdrop-blur-sm hover:bg-surface"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Share button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-surface/80 backdrop-blur-sm hover:bg-surface"
        >
          <Share2 className="h-5 w-5" />
        </Button>

        {/* Live indicator */}
        {event.isLive && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-destructive/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium text-white">AO VIVO</span>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Event Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">{event.title}</h1>
          
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-surface">
                {event.organizerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{event.organizerName}</p>
              <p className="text-sm text-muted-foreground">Organizador</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-foreground">{event.date}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-foreground">{event.location}</p>
                <p className="text-sm text-muted-foreground">{event.fullAddress}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-foreground">{event.estimatedAttendees} pessoas interessadas</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-2">Sobre o evento</h3>
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-3">
            <Button variant="glow" className="flex-1" size="lg">
              Confirmar Presença
            </Button>
            <Button variant="outline" size="lg">
              <MapPin className="h-4 w-4" />
              Mapa
            </Button>
          </div>
          
          {/* Registration button for events that require it */}
          {event.requiresRegistration && (
            <Button 
              variant="secondary" 
              className="w-full" 
              size="lg"
              onClick={onRegister}
            >
              <Users className="h-4 w-4 mr-2" />
              Fazer Cadastro no Evento
            </Button>
          )}
          
          {/* Find Friends button for live events */}
          {event.isLive && (
            <Button 
              variant="live" 
              className="w-full" 
              size="lg"
              onClick={onFindFriends}
            >
              <Users className="h-4 w-4 mr-2" />
              Encontrar Amigos no Evento
            </Button>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center justify-between py-4 border-t border-border">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 transition-smooth hover:scale-110">
              <Heart className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{event.likes}</span>
            </button>
            
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{event.comments} comentários</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Comentários</h3>
          
          {/* Add comment */}
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-surface text-xs">V</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Adicione um comentário..."
                className="min-h-[80px] resize-none"
              />
              <Button variant="glow" size="sm" className="mt-2">
                Comentar
              </Button>
            </div>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-surface text-xs">
                    {comment.user.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{comment.user}</span>
                    <span className="text-xs text-muted-foreground">{comment.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                </div>
              </div>
            ))}
            
            <Button variant="ghost" className="w-full">
              Ver mais comentários
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}