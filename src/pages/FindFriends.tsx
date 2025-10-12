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
  const {
    user
  } = useAuth();
  const navigate = useNavigate();

  // Load user visibility preference
  useEffect(() => {
    const loadVisibility = async () => {
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('profiles').select('find_friends_visible').eq('user_id', user.id).single();
      if (data && !error) {
        setIsVisible(data.find_friends_visible ?? false);
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
    const fetchEventAttendees = async () => {
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
      try {
        // First, get events where current user registered with confirmed attendance (exclude online/live)
        const {
          data: myRegistrations,
          error: myRegError
        } = await supabase.from('event_registrations').select('event_id, events!inner(is_live)').eq('user_id', user.id).eq('attendance_confirmed', true).eq('events.is_live', false);
        if (myRegError) {
          console.error('Error fetching my registrations:', myRegError);
          setLoading(false);
          return;
        }
        if (!myRegistrations || myRegistrations.length === 0) {
          setAttendees([]);
          setLoading(false);
          return;
        }
        const myEventIds = myRegistrations.map(reg => reg.event_id);

        // Get other users with confirmed attendance in the same in-person events who are visible
        const {
          data,
          error
        } = await supabase.from('event_registrations').select(`
            id,
            user_id,
            user_name,
            event_id,
            events!inner(
              title,
              is_live
            )
          `).in('event_id', myEventIds).eq('attendance_confirmed', true).eq('events.is_live', false).neq('user_id', user.id);
        if (error) {
          console.error('Error fetching attendees:', error);
          setLoading(false);
          return;
        }

        // Now fetch profile data for each user
        const userIds = data?.map(reg => reg.user_id) || [];
        if (userIds.length === 0) {
          setAttendees([]);
          setLoading(false);
          return;
        }
        const {
          data: profilesData,
          error: profilesError
        } = await supabase.from('profiles').select('user_id, avatar_url, notes, notes_visible, find_friends_visible, instagram_url, phone, interest, relationship_status').in('user_id', userIds).eq('find_friends_visible', true).eq('notes_visible', true);
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setLoading(false);
          return;
        }

        // Create a map of profiles by user_id
        const profilesMap = new Map((profilesData || []).map(p => [p.user_id, p]));

        // Combine registration data with profile data and remove duplicates
        const attendeesMap = new Map<string, Attendee>();
        (data || []).filter(registration => profilesMap.has(registration.user_id)).forEach((registration: any) => {
          // Only add if user not already in map (prevents duplicates)
          if (!attendeesMap.has(registration.user_id)) {
            const profile = profilesMap.get(registration.user_id);
            attendeesMap.set(registration.user_id, {
              id: registration.user_id,
              // Use user_id as unique id instead of registration id
              user_id: registration.user_id,
              name: registration.user_name,
              avatar: profile?.avatar_url || "",
              interest: profile?.interest || "curtição",
              note: profile?.notes || "Participante do evento",
              distance: `${Math.floor(Math.random() * 100) + 10}m`,
              instagram: profile?.instagram_url || "",
              phone: profile?.phone || null,
              event_name: registration.events?.title || "Evento",
              relationship_status: profile?.relationship_status || "preferencia_nao_informar"
            });
          }
        });
        const formattedAttendees: Attendee[] = Array.from(attendeesMap.values());
        setAttendees(formattedAttendees);

        // Load unread messages count for each user
        const userIdsForMessages = formattedAttendees.map(a => a.user_id);
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
        const userIdsForRealtime = formattedAttendees.map(a => a.user_id);
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
    fetchEventAttendees();
    return () => {
      if (channel) {
        console.log('Removendo canal de profiles');
        supabase.removeChannel(channel);
      }
    };
  }, [user, isVisible]);
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
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-surface rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">
              {isVisible ? "Você está visível para outros" : "Pessoas próximas"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isVisible ? "Outras pessoas com presença confirmada no evento podem te encontrar. Toque em 'Ser Visto' novamente para ficar invisível." : "Conecte-se com pessoas que confirmaram presença e estão visíveis. Para aparecer para outros, ative 'Ser Visto' e confirme sua presença no evento."}
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
              {isVisible ? "Nenhuma pessoa encontrada" : "Você precisa ser visível para ver outras pessoas"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {isVisible ? "Não há outras pessoas com presença confirmada e visíveis em eventos ao vivo no momento. Lembre-se de confirmar sua presença no evento!" : "Ative 'Ser Visto' no topo da página para poder ver e se conectar com outras pessoas do evento."}
            </p>
          </div>}

        {/* Bottom CTA */}
        
      </div>

      {/* Chat Dialog */}
      {selectedChat && <UserChatDialog open={chatOpen} onOpenChange={setChatOpen} recipientId={selectedChat.user_id} recipientName={selectedChat.name} recipientAvatar={selectedChat.avatar} />}
    </div>;
}