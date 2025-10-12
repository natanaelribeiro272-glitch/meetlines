import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Users, MessageCircle, Instagram, Phone, Eye, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import UserChatDialog from "@/components/UserChatDialog";
interface Attendee {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  interest: string;
  note: string;
  distance: string;
  instagram: string;
  phone: string | null;
  event_name: string;
  relationship_status: string;
  unreadMessages?: number;
}
interface FindFriendsProps {
  onBack: () => void;
}
export default function FindFriends({
  onBack
}: FindFriendsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedUsers, setLikedUsers] = useState<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Attendee | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Map<string, number>>(new Map());
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentInterest, setCurrentInterest] = useState<string>("curtição");
  const [currentNotes, setCurrentNotes] = useState<string>("");
  const [notesVisible, setNotesVisible] = useState<boolean>(true);
  const {
    user
  } = useAuth();
  const navigate = useNavigate();

  // Request geolocation and update user location
  useEffect(() => {
    if (!user || !isVisible) return;

    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo navegador');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        setLocationError(null);

        // Update user location in database
        await supabase
          .from('profiles')
          .update({
            latitude,
            longitude,
            location_updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Erro ao obter localização. Permita o acesso à localização.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, isVisible]);

  // Load user visibility preference and profile data
  useEffect(() => {
    const loadVisibility = async () => {
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('profiles').select('find_friends_visible, interest, notes, notes_visible').eq('user_id', user.id).single();
      if (data && !error) {
        setIsVisible(data.find_friends_visible ?? false);
        setCurrentInterest(data.interest || "curtição");
        setCurrentNotes(data.notes || "");
        setNotesVisible(data.notes_visible ?? true);
      }
    };
    loadVisibility();
  }, [user]);

  // Toggle visibility and save to database
  const toggleVisibility = async () => {
    if (!user) {
      toast.error('Faça login para usar esta funcionalidade');
      return;
    }
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    const {
      error
    } = await supabase.from('profiles').update({
      find_friends_visible: newVisibility
    }).eq('user_id', user.id);
    if (error) {
      console.error('Error updating visibility:', error);
      toast.error('Erro ao atualizar visibilidade');
      setIsVisible(!newVisibility); // Revert on error
    } else {
      toast.success(newVisibility ? 'Você está visível para outros' : 'Você está invisível');
    }
  };

  // Load user likes
  useEffect(() => {
    const loadLikes = async () => {
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('user_likes').select('to_user_id').eq('from_user_id', user.id);
      if (data && !error) {
        setLikedUsers(new Set(data.map(like => like.to_user_id)));
      }
    };
    loadLikes();
  }, [user]);
  useEffect(() => {
    let channel: any = null;
    const fetchNearbyUsers = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Se o usuário não está visível, não pode ver outras pessoas
      if (!isVisible) {
        setAttendees([]);
        setLoading(false);
        return;
      }

      // Precisa de localização para encontrar pessoas próximas
      if (!userLocation) {
        setAttendees([]);
        setLoading(false);
        return;
      }

      try {
        // Buscar todos os usuários visíveis com localização recente (últimos 5 minutos)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const {
          data: profilesData,
          error: profilesError
        } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, notes, notes_visible, find_friends_visible, instagram_url, phone, interest, relationship_status, latitude, longitude')
          .eq('find_friends_visible', true)
          .eq('notes_visible', true)
          .neq('user_id', user.id)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .gte('location_updated_at', fiveMinutesAgo);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setLoading(false);
          return;
        }

        if (!profilesData || profilesData.length === 0) {
          setAttendees([]);
          setLoading(false);
          return;
        }

        // Calcular distância e filtrar até 100m
        const nearbyUsers = profilesData
          .map(profile => {
            // Fórmula de Haversine simplificada
            const R = 6371000; // Raio da Terra em metros
            const lat1 = userLocation.lat * Math.PI / 180;
            const lat2 = profile.latitude! * Math.PI / 180;
            const deltaLat = (profile.latitude! - userLocation.lat) * Math.PI / 180;
            const deltaLon = (profile.longitude! - userLocation.lon) * Math.PI / 180;

            const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                     Math.cos(lat1) * Math.cos(lat2) *
                     Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;

            return {
              ...profile,
              calculatedDistance: distance
            };
          })
          .filter(profile => profile.calculatedDistance <= 100) // Filtrar até 100 metros
          .map(profile => ({
            id: profile.user_id,
            user_id: profile.user_id,
            name: profile.display_name || "Usuário",
            avatar: profile.avatar_url || "",
            interest: profile.interest || "curtição",
            note: profile.notes || "Está próximo de você",
            distance: profile.calculatedDistance < 1 
              ? `${Math.round(profile.calculatedDistance)}m`
              : profile.calculatedDistance < 10
              ? `${Math.round(profile.calculatedDistance)}m`
              : profile.calculatedDistance < 100
              ? `${Math.round(profile.calculatedDistance)}m`
              : `${Math.round(profile.calculatedDistance)}m`,
            instagram: profile.instagram_url || "",
            phone: profile.phone || null,
            event_name: "Próximo",
            relationship_status: profile.relationship_status || "preferencia_nao_informar"
          }))
          .sort((a, b) => {
            // Ordenar por distância
            const distA = parseFloat(a.distance);
            const distB = parseFloat(b.distance);
            return distA - distB;
          });

        setAttendees(nearbyUsers);

        // Load unread messages count for each user
        const userIdsForMessages = nearbyUsers.map(a => a.user_id);
        if (userIdsForMessages.length > 0) {
          const {
            data: messagesData
          } = await supabase.from('user_messages').select('from_user_id').eq('to_user_id', user.id).in('from_user_id', userIdsForMessages).eq('read', false);
          if (messagesData) {
            const unreadMap = new Map<string, number>();
            messagesData.forEach(msg => {
              unreadMap.set(msg.from_user_id, (unreadMap.get(msg.from_user_id) || 0) + 1);
            });
            setUnreadMessages(unreadMap);
          }
        }

        // Subscribe to realtime updates for profiles and messages
        const userIdsForRealtime = nearbyUsers.map(a => a.user_id);
        channel = supabase.channel('profiles-and-messages-updates').on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        }, payload => {
          const updatedProfile = payload.new as any;

          // Only update if it's one of our attendees
          if (userIdsForRealtime.includes(updatedProfile.user_id)) {
            console.log('Profile atualizado em tempo real:', updatedProfile);
            setAttendees(prev => prev.map(attendee => attendee.user_id === updatedProfile.user_id ? {
              ...attendee,
              note: updatedProfile.notes || attendee.note,
              relationship_status: updatedProfile.relationship_status || attendee.relationship_status,
              interest: updatedProfile.interest || attendee.interest
            } : attendee));
          }
        }).on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages'
        }, payload => {
          const newMessage = payload.new as any;

          // If we receive a message from one of our attendees
          if (newMessage.to_user_id === user.id && userIdsForRealtime.includes(newMessage.from_user_id)) {
            console.log('Nova mensagem recebida de:', newMessage.from_user_id);
            setUnreadMessages(prev => {
              const newMap = new Map(prev);
              newMap.set(newMessage.from_user_id, (newMap.get(newMessage.from_user_id) || 0) + 1);
              return newMap;
            });
          }
        }).on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_messages'
        }, payload => {
          const updatedMessage = payload.new as any;

          // If message was marked as read
          if (updatedMessage.read && updatedMessage.to_user_id === user.id) {
            console.log('Mensagem marcada como lida de:', updatedMessage.from_user_id);
            // Reload unread count for this user
            supabase.from('user_messages').select('id').eq('to_user_id', user.id).eq('from_user_id', updatedMessage.from_user_id).eq('read', false).then(({
              data
            }) => {
              setUnreadMessages(prev => {
                const newMap = new Map(prev);
                if (data && data.length > 0) {
                  newMap.set(updatedMessage.from_user_id, data.length);
                } else {
                  newMap.delete(updatedMessage.from_user_id);
                }
                return newMap;
              });
            });
          }
        }).subscribe(status => {
          console.log('Status da inscrição de profiles e mensagens:', status);
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNearbyUsers();
    return () => {
      if (channel) {
        console.log('Removendo canal de profiles');
        supabase.removeChannel(channel);
      }
    };
  }, [user, isVisible, userLocation]);
  const handleLike = async (userId: string) => {
    if (!user) {
      toast.error('Faça login para curtir perfis');
      return;
    }
    try {
      const isLiked = likedUsers.has(userId);
      if (isLiked) {
        // Unlike
        const {
          error
        } = await supabase.from('user_likes').delete().eq('from_user_id', user.id).eq('to_user_id', userId);
        if (error) throw error;
        setLikedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast.success('Curtida removida');
      } else {
        // Like
        const {
          error
        } = await supabase.from('user_likes').insert({
          from_user_id: user.id,
          to_user_id: userId
        });
        if (error) throw error;
        setLikedUsers(prev => new Set(prev).add(userId));
        toast.success('Perfil curtido! A pessoa receberá uma notificação');
      }
    } catch (error) {
      console.error('Error liking user:', error);
      toast.error('Erro ao curtir perfil');
    }
  };
  const handleMessage = async (person: Attendee) => {
    setSelectedChat(person);
    setChatOpen(true);

    // Clear unread messages for this user when opening chat
    setUnreadMessages(prev => {
      const newMap = new Map(prev);
      newMap.delete(person.user_id);
      return newMap;
    });
  };
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      curtição: {
        color: "bg-yellow-500/20 text-yellow-400",
        icon: "💛"
      },
      namoro: {
        color: "bg-red-500/20 text-red-400",
        icon: "💕"
      },
      amizade: {
        color: "bg-blue-500/20 text-blue-400",
        icon: "🤝"
      },
      network: {
        color: "bg-green-500/20 text-green-400",
        icon: "🤝"
      }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={`${config.color} border-0`}>
        <span className="mr-1">{config.icon}</span>
        {status}
      </Badge>;
  };
  const getRelationshipBadge = (status: string) => {
    const statusConfig = {
      solteiro: {
        color: "bg-green-500/20 text-green-400",
        label: "Solteiro(a)",
        emoji: "😊"
      },
      namorando: {
        color: "bg-pink-500/20 text-pink-400",
        label: "Namorando",
        emoji: "💑"
      },
      casado: {
        color: "bg-purple-500/20 text-purple-400",
        label: "Casado(a)",
        emoji: "💍"
      },
      relacionamento_aberto: {
        color: "bg-orange-500/20 text-orange-400",
        label: "Relacionamento Aberto",
        emoji: "🌈"
      },
      preferencia_nao_informar: {
        color: "bg-gray-500/20 text-gray-400",
        label: "Não informado",
        emoji: "🤐"
      }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.preferencia_nao_informar;
    return <Badge className={`${config.color} border-0 text-xs`}>
        <span className="mr-1">{config.emoji}</span>
        {config.label}
      </Badge>;
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground">Encontrar Amigos</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={isVisible ? "glow" : "outline"} size="sm" onClick={toggleVisibility}>
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
        {/* Editable Profile Section */}
        {isVisible && (
          <div className="mb-6 p-4 bg-card rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-3">Como você quer aparecer</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Interesse</label>
                <select
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground"
                  value={currentInterest}
                  onChange={async (e) => {
                    if (!user) return;
                    setCurrentInterest(e.target.value);
                    await supabase
                      .from('profiles')
                      .update({ interest: e.target.value as any })
                      .eq('user_id', user.id);
                    toast.success('Interesse atualizado');
                  }}
                >
                  <option value="curtição">💛 Curtição</option>
                  <option value="namoro">💕 Namoro</option>
                  <option value="amizade">🤝 Amizade</option>
                  <option value="network">💼 Network</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Notas sobre você</label>
                <textarea
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground resize-none"
                  rows={3}
                  placeholder="Escreva algo sobre você..."
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  onBlur={async (e) => {
                    if (!user) return;
                    await supabase
                      .from('profiles')
                      .update({ notes: e.target.value })
                      .eq('user_id', user.id);
                    toast.success('Notas atualizadas');
                  }}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="notes-visible"
                    checked={notesVisible}
                    onChange={async (e) => {
                      if (!user) return;
                      setNotesVisible(e.target.checked);
                      await supabase
                        .from('profiles')
                        .update({ notes_visible: e.target.checked })
                        .eq('user_id', user.id);
                      toast.success(e.target.checked ? 'Notas visíveis para outros' : 'Notas privadas');
                    }}
                    className="rounded border-border"
                  />
                  <label htmlFor="notes-visible" className="text-xs text-muted-foreground">
                    {notesVisible ? '✓ Visível para outros' : 'Privado'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
              ? locationError 
                ? locationError
                : !userLocation
                ? "Aguardando sua localização para encontrar pessoas próximas..."
                : "Outras pessoas até 100m de você podem te encontrar. Toque em 'Ser Visto' novamente para ficar invisível."
              : "Conecte-se com pessoas até 100 metros de você. Para aparecer para outros, ative 'Ser Visto' e permita o acesso à localização."}
          </p>
        </div>

        {/* Attendees List */}
        {loading ? <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Procurando pessoas...</p>
          </div> : attendees.length > 0 ? <div className="space-y-4">
            {attendees.map(person => <div key={person.id} className="bg-card rounded-lg p-4 shadow-card">
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
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {getStatusBadge(person.interest)}
                      {getRelationshipBadge(person.relationship_status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {person.note}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{person.event_name}</span>
                    </div>
                    
                    {/* Social Links */}
                    <div className="flex items-center gap-3 mt-3">
                      {person.instagram && <a href={person.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:text-primary-glow transition-smooth">
                          <Instagram className="h-4 w-4" />
                          <span>Instagram</span>
                        </a>}
                      
                      {person.phone && <a href={`https://wa.me/${person.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:text-primary-glow transition-smooth">
                          <Phone className="h-4 w-4" />
                          <span>WhatsApp</span>
                        </a>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button variant={likedUsers.has(person.user_id) ? "default" : "outline"} size="sm" onClick={() => handleLike(person.user_id)}>
                      <Heart className="h-4 w-4" fill={likedUsers.has(person.user_id) ? "currentColor" : "none"} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleMessage(person)} className="relative">
                      <MessageCircle className="h-4 w-4" />
                      {unreadMessages.get(person.user_id) && unreadMessages.get(person.user_id)! > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                          {unreadMessages.get(person.user_id)}
                        </Badge>}
                    </Button>
                  </div>
                </div>
              </div>)}
          </div> : <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isVisible 
                ? locationError
                  ? "Erro ao acessar localização"
                  : !userLocation
                  ? "Aguardando localização..."
                  : "Nenhuma pessoa encontrada"
                : "Você precisa ser visível para ver outras pessoas"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {isVisible 
                ? locationError
                  ? "Permita o acesso à localização no seu navegador para encontrar pessoas próximas."
                  : !userLocation
                  ? "Carregando sua localização para encontrar pessoas até 100m de você..."
                  : "Não há outras pessoas visíveis até 100 metros de você no momento."
                : "Ative 'Ser Visto' e permita o acesso à localização para se conectar com pessoas próximas."}
            </p>
          </div>}

        {/* Bottom CTA */}
        
      </div>

      {/* Chat Dialog */}
      {selectedChat && <UserChatDialog open={chatOpen} onOpenChange={setChatOpen} recipientId={selectedChat.user_id} recipientName={selectedChat.name} recipientAvatar={selectedChat.avatar} />}
    </div>;
}