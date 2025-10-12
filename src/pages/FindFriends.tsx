import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Users, MessageCircle, Instagram, Phone, Eye, MapPin, X, UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import UserChatDialog from "@/components/UserChatDialog";
import { useFriendship } from "@/hooks/useFriendship";
import StoriesBar from "@/components/StoriesBar";

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
  isFriend?: boolean;
}

interface FindFriendsProps {
  onBack: () => void;
}

// UserCard component with friendship button
const UserCard = ({ person, handleLike, handleMessage, likedUsers, unreadMessages, onFriendshipChange }: { 
  person: Attendee; 
  handleLike: (userId: string) => void;
  handleMessage: (person: Attendee) => void;
  likedUsers: Set<string>;
  unreadMessages: Map<string, number>;
  onFriendshipChange: () => void;
}) => {
  const { friendshipStatus, loading, addFriend, removeFriend } = useFriendship(person.user_id);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const handleFriendshipToggle = async () => {
    if (friendshipStatus === 'accepted') {
      await removeFriend();
    } else {
      await addFriend();
    }
    onFriendshipChange();
  };

  return (
    <div className="bg-card rounded-lg p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="avatar-story cursor-pointer" onClick={() => setSelectedAvatar(person.avatar)}>
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
            {person.isFriend && (
              <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                🤝 Amigo
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge className={`${
              person.interest === 'curtição' ? 'bg-yellow-500/20 text-yellow-400' :
              person.interest === 'namoro' ? 'bg-red-500/20 text-red-400' :
              person.interest === 'amizade' ? 'bg-blue-500/20 text-blue-400' :
              'bg-green-500/20 text-green-400'
            } border-0`}>
              <span className="mr-1">
                {person.interest === 'curtição' ? '💛' :
                 person.interest === 'namoro' ? '💕' :
                 person.interest === 'amizade' ? '🤝' : '💼'}
              </span>
              {person.interest}
            </Badge>
            
            <Badge className={`${
              person.relationship_status === 'solteiro' ? 'bg-green-500/20 text-green-400' :
              person.relationship_status === 'namorando' ? 'bg-pink-500/20 text-pink-400' :
              person.relationship_status === 'casado' ? 'bg-purple-500/20 text-purple-400' :
              person.relationship_status === 'relacionamento_aberto' ? 'bg-orange-500/20 text-orange-400' :
              'bg-gray-500/20 text-gray-400'
            } border-0 text-xs`}>
              <span className="mr-1">
                {person.relationship_status === 'solteiro' ? '😊' :
                 person.relationship_status === 'namorando' ? '💑' :
                 person.relationship_status === 'casado' ? '💍' :
                 person.relationship_status === 'relacionamento_aberto' ? '🌈' : '🤐'}
              </span>
              {person.relationship_status === 'solteiro' ? 'Solteiro(a)' :
               person.relationship_status === 'namorando' ? 'Namorando' :
               person.relationship_status === 'casado' ? 'Casado(a)' :
               person.relationship_status === 'relacionamento_aberto' ? 'Relacionamento Aberto' :
               'Não informado'}
            </Badge>
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
            {person.instagram && (
              <a 
                href={person.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1 text-sm text-primary hover:text-primary-glow transition-smooth"
              >
                <Instagram className="h-4 w-4" />
                <span>Instagram</span>
              </a>
            )}
            
            {person.phone && (
              <a 
                href={`https://wa.me/${person.phone.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1 text-sm text-primary hover:text-primary-glow transition-smooth"
              >
                <Phone className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button 
            variant={friendshipStatus === 'accepted' ? "default" : "outline"} 
            size="sm" 
            onClick={handleFriendshipToggle}
            disabled={loading}
            className={friendshipStatus === 'accepted' ? "text-green-400 bg-green-500/20 border-green-500" : ""}
          >
            {friendshipStatus === 'accepted' ? (
              <UserCheck className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
          </Button>
          <Button 
            variant={likedUsers.has(person.user_id) ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleLike(person.user_id)}
          >
            <Heart 
              className="h-4 w-4" 
              fill={likedUsers.has(person.user_id) ? "currentColor" : "none"} 
            />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleMessage(person)} 
            className="relative"
          >
            <MessageCircle className="h-4 w-4" />
            {unreadMessages.get(person.user_id) && unreadMessages.get(person.user_id)! > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
              >
                {unreadMessages.get(person.user_id)}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Avatar Preview Dialog */}
      <Dialog open={!!selectedAvatar} onOpenChange={() => setSelectedAvatar(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background/95 backdrop-blur-lg border border-border">
          <button
            onClick={() => setSelectedAvatar(null)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-surface/80 hover:bg-surface transition-smooth"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
          {selectedAvatar && (
            <img
              src={selectedAvatar}
              alt="Profile"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function FindFriends({
  onBack
}: FindFriendsProps) {
  const [activeTab, setActiveTab] = useState<'nearby' | 'friends'>('nearby');
  const [isVisible, setIsVisible] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [friendsList, setFriendsList] = useState<Attendee[]>([]);
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
  const { user } = useAuth();
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
      const { data, error } = await supabase
        .from('profiles')
        .select('find_friends_visible, interest, notes, notes_visible')
        .eq('user_id', user.id)
        .single();
      
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
    const { error } = await supabase
      .from('profiles')
      .update({ find_friends_visible: newVisibility })
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error updating visibility:', error);
      toast.error('Erro ao atualizar visibilidade');
      setIsVisible(!newVisibility);
    } else {
      toast.success(newVisibility ? 'Você está visível para outros' : 'Você está invisível');
    }
  };

  // Load user likes
  useEffect(() => {
    const loadLikes = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user_likes')
        .select('to_user_id')
        .eq('from_user_id', user.id);
      
      if (data && !error) {
        setLikedUsers(new Set(data.map(like => like.to_user_id)));
      }
    };
    loadLikes();
  }, [user]);

  // Fetch friends list
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;

      try {
        const { data: friendshipsData, error: friendshipsError } = await supabase
          .from('friendships')
          .select('user_id, friend_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (friendshipsError) {
          console.error('Error fetching friendships:', friendshipsError);
          return;
        }

        const friendIds = friendshipsData?.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        ) || [];

        if (friendIds.length === 0) {
          setFriendsList([]);
          return;
        }

        // Fetch friend profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, notes, instagram_url, phone, interest, relationship_status')
          .in('user_id', friendIds);

        if (profilesError) {
          console.error('Error fetching friend profiles:', profilesError);
          return;
        }

        const friends = (profilesData || []).map(profile => ({
          id: profile.user_id,
          user_id: profile.user_id,
          name: profile.display_name || "Usuário",
          avatar: profile.avatar_url || "",
          interest: profile.interest || "curtição",
          note: profile.notes || "Seu amigo",
          distance: "Amigo",
          instagram: profile.instagram_url || "",
          phone: profile.phone || null,
          event_name: "Amigo",
          relationship_status: profile.relationship_status || "preferencia_nao_informar",
          isFriend: true
        }));

        setFriendsList(friends);

        // Load unread messages for friends
        if (friends.length > 0) {
          const { data: messagesData } = await supabase
            .from('user_messages')
            .select('from_user_id')
            .eq('to_user_id', user.id)
            .in('from_user_id', friendIds)
            .eq('read', false);
          
          if (messagesData) {
            const unreadMap = new Map<string, number>();
            messagesData.forEach(msg => {
              unreadMap.set(msg.from_user_id, (unreadMap.get(msg.from_user_id) || 0) + 1);
            });
            setUnreadMessages(prev => new Map([...prev, ...unreadMap]));
          }
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();
  }, [user]);

  // Fetch nearby users
  useEffect(() => {
    let channel: any = null;
    const fetchNearbyUsers = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (!isVisible) {
        setAttendees([]);
        setLoading(false);
        return;
      }

      if (!userLocation) {
        setAttendees([]);
        setLoading(false);
        return;
      }

      try {
        // Buscar amigos para excluir da lista de próximos
        const { data: friendshipsData, error: friendshipsError } = await supabase
          .from('friendships')
          .select('user_id, friend_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (friendshipsError) {
          console.error('Error fetching friendships:', friendshipsError);
        }

        const friendIds = friendshipsData?.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        ) || [];

        // Buscar usuários visíveis
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, notes, notes_visible, find_friends_visible, instagram_url, phone, interest, relationship_status, latitude, longitude, location_updated_at')
          .eq('find_friends_visible', true)
          .neq('user_id', user.id)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

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

        // Calcular distância e filtrar (apenas pessoas próximas, não amigos)
        const nearbyUsers = profilesData
          .filter(profile => !friendIds.includes(profile.user_id)) // Excluir amigos
          .map(profile => {
            const R = 6371000;
            const lat1 = userLocation.lat * Math.PI / 180;
            const lat2 = profile.latitude! * Math.PI / 180;
            const deltaLat = (profile.latitude! - userLocation.lat) * Math.PI / 180;
            const deltaLon = (profile.longitude! - userLocation.lon) * Math.PI / 180;

            const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                     Math.cos(lat1) * Math.cos(lat2) *
                     Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;

            const hasRecentLocation = profile.location_updated_at && 
              new Date(profile.location_updated_at) >= new Date(tenMinutesAgo);

            return {
              profile,
              distance,
              hasRecentLocation
            };
          })
          .filter(({ distance, hasRecentLocation }) => 
            distance <= 100 && hasRecentLocation
          )
          .map(({ profile, distance }) => ({
            id: profile.user_id,
            user_id: profile.user_id,
            name: profile.display_name || "Usuário",
            avatar: profile.avatar_url || "",
            interest: profile.interest || "curtição",
            note: profile.notes || "Está próximo de você",
            distance: `${Math.round(distance)}m`,
            instagram: profile.instagram_url || "",
            phone: profile.phone || null,
            event_name: "Próximo",
            relationship_status: profile.relationship_status || "preferencia_nao_informar",
            isFriend: false
          }))
          .sort((a, b) => {
            const distA = parseFloat(a.distance);
            const distB = parseFloat(b.distance);
            return distA - distB;
          });

        setAttendees(nearbyUsers);

        // Load unread messages count
        const userIdsForMessages = nearbyUsers.map(a => a.user_id);
        if (userIdsForMessages.length > 0) {
          const { data: messagesData } = await supabase
            .from('user_messages')
            .select('from_user_id')
            .eq('to_user_id', user.id)
            .in('from_user_id', userIdsForMessages)
            .eq('read', false);
          
          if (messagesData) {
            const unreadMap = new Map<string, number>();
            messagesData.forEach(msg => {
              unreadMap.set(msg.from_user_id, (unreadMap.get(msg.from_user_id) || 0) + 1);
            });
            setUnreadMessages(unreadMap);
          }
        }

        // Subscribe to realtime updates
        const userIdsForRealtime = nearbyUsers.map(a => a.user_id);
        channel = supabase.channel('profiles-and-messages-updates')
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles'
          }, payload => {
            const updatedProfile = payload.new as any;
            if (userIdsForRealtime.includes(updatedProfile.user_id)) {
              setAttendees(prev => prev.map(attendee => 
                attendee.user_id === updatedProfile.user_id ? {
                  ...attendee,
                  note: updatedProfile.notes || attendee.note,
                  relationship_status: updatedProfile.relationship_status || attendee.relationship_status,
                  interest: updatedProfile.interest || attendee.interest
                } : attendee
              ));
            }
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'user_messages'
          }, payload => {
            const newMessage = payload.new as any;
            if (newMessage.to_user_id === user.id && userIdsForRealtime.includes(newMessage.from_user_id)) {
              setUnreadMessages(prev => {
                const newMap = new Map(prev);
                newMap.set(newMessage.from_user_id, (newMap.get(newMessage.from_user_id) || 0) + 1);
                return newMap;
              });
            }
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_messages'
          }, payload => {
            const updatedMessage = payload.new as any;
            if (updatedMessage.read && updatedMessage.to_user_id === user.id) {
              supabase.from('user_messages')
                .select('id')
                .eq('to_user_id', user.id)
                .eq('from_user_id', updatedMessage.from_user_id)
                .eq('read', false)
                .then(({ data }) => {
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
          })
          .subscribe();
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNearbyUsers();
    
    return () => {
      if (channel) {
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
        const { error } = await supabase
          .from('user_likes')
          .delete()
          .eq('from_user_id', user.id)
          .eq('to_user_id', userId);
        
        if (error) throw error;
        setLikedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast.success('Curtida removida');
      } else {
        const { error } = await supabase
          .from('user_likes')
          .insert({ from_user_id: user.id, to_user_id: userId });
        
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
    setUnreadMessages(prev => {
      const newMap = new Map(prev);
      newMap.delete(person.user_id);
      return newMap;
    });
  };

  const handleFriendshipChange = () => {
    // Reload the page to fetch updated friend list
    if (user && userLocation) {
      window.location.reload();
    }
  };

  const displayedUsers = activeTab === 'nearby' ? attendees : friendsList;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground">Conectar</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-3 max-w-md mx-auto">
          <Button
            variant={activeTab === 'nearby' ? "default" : "outline"}
            className="flex-1 rounded-full"
            onClick={() => setActiveTab('nearby')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Próximos
          </Button>
          <Button
            variant={activeTab === 'friends' ? "default" : "outline"}
            className="flex-1 rounded-full"
            onClick={() => setActiveTab('friends')}
          >
            <Users className="h-4 w-4 mr-2" />
            Amigos
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Nearby Tab Controls */}
        {activeTab === 'nearby' && (
          <>
            {/* Visibility Controls */}
            <div className="mb-4">
              <Button 
                variant={isVisible ? "default" : "outline"} 
                onClick={toggleVisibility}
                className="w-full h-11"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isVisible ? "Visível" : "Ser Visto"}
              </Button>
            </div>

            {/* Editable Profile Section */}
            {isVisible && (
              <div className="mb-4 p-3 bg-card rounded-lg border border-border">
                <h3 className="font-medium text-sm text-foreground mb-2">Como você quer aparecer</h3>
                
                <div className="space-y-2">
                  <div>
                    <select
                      className="w-full px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground"
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
                    <textarea
                      className="w-full px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground resize-none"
                      rows={2}
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
                  </div>
                </div>
              </div>
            )}
            
            {/* Info Banner */}
            <div className="mb-6 p-4 bg-surface rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
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
                    : "Outras pessoas até 100m de você podem te encontrar."
                  : "Conecte-se com pessoas até 100 metros de você. Para aparecer para outros, ative 'Ser Visto'."}
              </p>
            </div>

            {/* Stories Bar */}
            {isVisible && userLocation && <StoriesBar />}
          </>
        )}

        {/* Friends Tab Info */}
        {activeTab === 'friends' && (
          <div className="mb-6 p-4 bg-surface rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Seus Amigos</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {friendsList.length === 0 
                ? "Você ainda não tem amigos adicionados. Vá para 'Próximos' e adicione pessoas próximas!"
                : `Você tem ${friendsList.length} ${friendsList.length === 1 ? 'amigo' : 'amigos'}. Seus amigos sempre aparecem aqui, não importa a distância.`}
            </p>
          </div>
        )}

        {/* Users List */}
        {loading && activeTab === 'nearby' ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Procurando pessoas...</p>
          </div>
        ) : displayedUsers.length > 0 ? (
          <div className="space-y-4">
            {displayedUsers.map(person => (
              <UserCard 
                key={person.id}
                person={person}
                handleLike={handleLike}
                handleMessage={handleMessage}
                likedUsers={likedUsers}
                unreadMessages={unreadMessages}
                onFriendshipChange={handleFriendshipChange}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            {activeTab === 'nearby' ? (
              <>
                <p className="text-muted-foreground">
                  {isVisible 
                    ? locationError
                      ? "Erro ao acessar localização"
                      : !userLocation
                      ? "Aguardando localização..."
                      : "Nenhuma pessoa próxima"
                    : "Você precisa ser visível"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {isVisible 
                    ? locationError
                      ? "Permita o acesso à localização no seu navegador."
                      : !userLocation
                      ? "Carregando sua localização..."
                      : "Não há pessoas visíveis até 100m de você."
                    : "Ative 'Ser Visto' para se conectar."}
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Você ainda não tem amigos</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vá para 'Próximos' e adicione pessoas próximas!
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Chat Dialog */}
      {selectedChat && (
        <UserChatDialog 
          open={chatOpen} 
          onOpenChange={setChatOpen} 
          recipientId={selectedChat.user_id} 
          recipientName={selectedChat.name} 
          recipientAvatar={selectedChat.avatar} 
        />
      )}
    </div>
  );
}
