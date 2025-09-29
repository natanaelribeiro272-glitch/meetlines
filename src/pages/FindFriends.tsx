import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Users, MessageCircle, Instagram, Phone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Attendee {
  id: string;
  name: string;
  avatar: string;
  status: string;
  note: string;
  distance: string;
  instagram: string;
  hasPhone: boolean;
}

interface FindFriendsProps {
  onBack: () => void;
}

export default function FindFriends({ onBack }: FindFriendsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEventAttendees = async () => {
      if (!user) return;
      
      try {
        // Get registrations for live events with profile data
        const { data, error } = await supabase
          .from('event_registrations')
          .select(`
            id,
            user_name,
            event_id,
            profiles!inner(
              avatar_url,
              notes,
              instagram_url
            ),
            events!inner(
              is_live
            )
          `)
          .eq('events.is_live', true)
          .neq('user_id', user.id); // Exclude current user

        if (error) {
          console.error('Error fetching attendees:', error);
          return;
        }

        const formattedAttendees: Attendee[] = (data || []).map((registration: any, index: number) => ({
          id: registration.id,
          name: registration.user_name,
          avatar: registration.profiles?.avatar_url || "",
          status: ["curtição", "amizade", "network"][index % 3],
          note: registration.profiles?.notes || "Participante do evento",
          distance: `${Math.floor(Math.random() * 100) + 10}m`,
          instagram: registration.profiles?.instagram_url || "",
          hasPhone: Math.random() > 0.5
        }));

        setAttendees(formattedAttendees);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAttendees();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      curtição: { color: "bg-yellow-500/20 text-yellow-400", icon: "💛" },
      namoro: { color: "bg-red-500/20 text-red-400", icon: "💕" },
      amizade: { color: "bg-blue-500/20 text-blue-400", icon: "🤝" },
      network: { color: "bg-green-500/20 text-green-400", icon: "🤝" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`${config.color} border-0`}>
        <span className="mr-1">{config.icon}</span>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground">Encontrar Amigos</h1>
            <p className="text-sm text-muted-foreground">Festival Eletrônico Underground</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={isVisible ? "glow" : "outline"} 
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {isVisible ? "Visível" : "Ser Visto"}
            </Button>
            <div className="flex items-center gap-1 text-sm text-primary">
              <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
              <span>AO VIVO</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-surface rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">
              {isVisible ? "Você está visível para outros" : "Pessoas próximas"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isVisible 
              ? "Outras pessoas no evento podem te encontrar. Toque em 'Ser Visto' novamente para ficar invisível."
              : "Conecte-se com pessoas que estão no evento agora. Sua localização é usada apenas durante eventos ao vivo."
            }
          </p>
        </div>

        {/* Attendees List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Procurando pessoas...</p>
          </div>
        ) : attendees.length > 0 ? (
          <div className="space-y-4">
            {attendees.map((person) => (
            <div key={person.id} className="bg-card rounded-lg p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="avatar-story">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={person.avatar} alt={person.name} />
                    <AvatarFallback className="bg-surface">
                      {person.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{person.name}</h3>
                    <span className="text-xs text-muted-foreground">• {person.distance}</span>
                  </div>
                  
                  {getStatusBadge(person.status)}
                  
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {person.note}
                  </p>
                  
                  {/* Social Links */}
                  <div className="flex items-center gap-3 mt-3">
                    <button className="flex items-center gap-1 text-sm text-primary hover:text-primary-glow transition-smooth">
                      <Instagram className="h-4 w-4" />
                      <span>{person.instagram}</span>
                    </button>
                    
                    {person.hasPhone && (
                      <button className="flex items-center gap-1 text-sm text-primary hover:text-primary-glow transition-smooth">
                        <Phone className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma pessoa encontrada</p>
            <p className="text-sm text-muted-foreground mt-2">Não há outras pessoas em eventos ao vivo no momento</p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 p-4 bg-surface rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Não vê seus amigos aqui? Convide-os para o evento!
          </p>
          <Button variant="glow" size="lg" className="w-full">
            Convidar Amigos
          </Button>
        </div>
      </div>
    </div>
  );
}