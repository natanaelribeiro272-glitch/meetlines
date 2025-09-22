import { Edit3, Share2, MapPin, Calendar, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import event1 from "@/assets/event-1.jpg";

export default function OrganizerPage() {
  const organizer = {
    name: "Electronic Vibes",
    bio: "Criando experiências únicas em música eletrônica desde 2019",
    followers: 1250,
    events: 15,
    pageViews: 8450,
  };

  const currentEvent = {
    title: "Festival Eletrônico Underground",
    image: event1,
    date: "Hoje, 22:00",
    location: "Warehouse District, São Paulo",
    attendees: 250,
    isLive: true,
    ordersEnabled: true,
  };

  const linkButtons = [
    { title: "Confirmar Presença", color: "primary", icon: "🎫" },
    { title: "Localização", color: "secondary", icon: "📍" },
    { title: "Galeria de Fotos", color: "muted", icon: "📸" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative h-64 bg-gradient-to-b from-surface to-background">
        <img
          src={currentEvent.image}
          alt="Cover"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-surface/80 backdrop-blur-sm"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </header>

      {/* Profile Section */}
      <div className="px-4 -mt-16 relative z-10 max-w-md mx-auto">
        <div className="flex items-end gap-4 mb-4">
          <div className="avatar-story">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarFallback className="bg-surface text-lg font-bold">
                {organizer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 pb-2">
            <h1 className="text-xl font-bold text-foreground">{organizer.name}</h1>
            <p className="text-sm text-muted-foreground">{organizer.bio}</p>
          </div>
          
          <Button variant="outline" size="sm">
            <Edit3 className="h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-around py-4 mb-6 bg-card rounded-lg">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{organizer.followers}</p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{organizer.events}</p>
            <p className="text-xs text-muted-foreground">Eventos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{organizer.pageViews}</p>
            <p className="text-xs text-muted-foreground">Visualizações</p>
          </div>
        </div>

        {/* Current Event */}
        <div className="mb-6 p-4 bg-card rounded-lg shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Evento Atual</h2>
            {currentEvent.isLive && (
              <div className="flex items-center gap-1 text-destructive">
                <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                <span className="text-xs font-medium">AO VIVO</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mb-3">
            <img
              src={currentEvent.image}
              alt={currentEvent.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground line-clamp-1">{currentEvent.title}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{currentEvent.date}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{currentEvent.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{currentEvent.attendees}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings */}
        <div className="mb-6 p-4 bg-card rounded-lg">
          <h3 className="font-semibold text-foreground mb-4">Configurações</h3>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">Área de Pedidos</p>
              <p className="text-sm text-muted-foreground">Permitir compras no evento</p>
            </div>
            <Switch checked={currentEvent.ordersEnabled} />
          </div>
        </div>

        {/* Quick Actions Menu */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-card rounded-lg shadow-card transition-smooth hover:shadow-elevated cursor-pointer">
              <span className="text-2xl mb-2 block">🎫</span>
              <p className="text-xs font-medium text-foreground">Pedidos</p>
            </div>
            <div className="text-center p-4 bg-card rounded-lg shadow-card transition-smooth hover:shadow-elevated cursor-pointer">
              <span className="text-2xl mb-2 block">🔗</span>
              <p className="text-xs font-medium text-foreground">Links</p>
            </div>
            <div className="text-center p-4 bg-card rounded-lg shadow-card transition-smooth hover:shadow-elevated cursor-pointer">
              <span className="text-2xl mb-2 block">📸</span>
              <p className="text-xs font-medium text-foreground">Fotos</p>
            </div>
          </div>
        </div>

        {/* Custom Link Buttons */}
        <div className="space-y-3 mb-8">
          <h3 className="font-semibold text-foreground">Seus Links</h3>
          
          {linkButtons.map((button, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-card transition-smooth hover:shadow-elevated cursor-pointer"
            >
              <span className="text-2xl">{button.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-foreground">{button.title}</p>
              </div>
              <Button variant="ghost" size="icon">
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button variant="outline" className="w-full">
            + Adicionar Link
          </Button>
        </div>

        {/* Share Link */}
        <div className="mb-8 p-4 bg-surface rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Compartilhar Página</h3>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-card rounded-md">
              <p className="text-sm font-mono text-muted-foreground">
                lovable.app/electronic-vibes
              </p>
            </div>
            <Button variant="glow">
              <Share2 className="h-4 w-4" />
              Copiar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}