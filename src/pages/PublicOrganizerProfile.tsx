import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Users, ExternalLink, MessageCircle, Camera, Music, MapPin, Calendar, Heart, Instagram, Globe, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getPublicBaseUrl } from "@/config/site";

// Componente auxiliar para fotos de evento
function EventPhotoGrid({ eventId, organizerId }: { eventId: string; organizerId: string }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        console.log('Buscando fotos para:', { eventId, organizerId });
        
        const { data, error } = await supabase
          .from('organizer_photos')
          .select('*')
          .eq('organizer_id', organizerId)
          .eq('event_id', eventId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        console.log('Fotos encontradas:', data);
        if (error) {
          console.error('Erro ao buscar fotos:', error);
          throw error;
        }
        
        setPhotos(data || []);
      } catch (error) {
        console.error('Error fetching event photos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [eventId, organizerId]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma foto deste evento ainda
      </p>
    );
  }

  const handleDownload = async (photoUrl: string, photoCaption: string) => {
    if (!user) {
      toast.error('Faça login para baixar fotos');
      navigate('/auth');
      return;
    }

    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = photoCaption || 'foto-evento.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Foto baixada com sucesso!');
    } catch (error) {
      console.error('Error downloading photo:', error);
      toast.error('Erro ao baixar a foto');
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.slice(0, 6).map((photo) => (
        <div key={photo.id} className="aspect-square bg-surface rounded-lg overflow-hidden relative group">
          <img 
            src={photo.photo_url} 
            alt={photo.caption || "Foto do evento"} 
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
          <button
            onClick={() => handleDownload(photo.photo_url, photo.caption)}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Baixar foto"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      ))}
      {photos.length > 6 && (
        <div className="aspect-square bg-surface rounded-lg overflow-hidden relative">
          <img 
            src={photos[6].photo_url} 
            alt="Mais fotos" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">+{photos.length - 6}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface OrganizerData {
  id: string;
  user_id: string;
  username: string;
  page_title: string;
  page_subtitle?: string;
  page_description?: string;
  theme: string;
  primary_color: string;
  cover_image_url?: string;
  avatar_url?: string;
  show_statistics: boolean;
  show_events: boolean;
  show_contact: boolean;
  whatsapp_url?: string;
  instagram_url?: string;
  playlist_url?: string;
  location_url?: string;
  website_url?: string;
  show_whatsapp?: boolean;
  show_instagram?: boolean;
  show_playlist?: boolean;
  show_location?: boolean;
  show_website?: boolean;
  profile?: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  };
  stats?: {
    followers_count: number;
    events_count: number;
    average_rating: number;
  };
}

interface EventData {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  event_date: string;
  location: string;
  current_attendees: number;
  is_live: boolean;
  likes_count?: number;
  comments_count?: number;
}

interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  color: string;
}

export default function PublicOrganizerProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("eventos");
  const [organizer, setOrganizer] = useState<OrganizerData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Buscar todos os eventos quando está na aba fotos
  useEffect(() => {
    const fetchAllEvents = async () => {
      if (!organizer) return;
      
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', organizer.id)
        .order('event_date', { ascending: false });
      
      setAllEvents(eventsData || []);
    };
    
    if (activeTab === 'fotos' && organizer) {
      fetchAllEvents();
    }
  }, [activeTab, organizer]);

  useEffect(() => {
    const fetchOrganizerData = async () => {
      if (!slug) return;

      try {
        setLoading(true);

        // Buscar organizador pelo username
        const { data: organizerData, error: organizerError } = await supabase
          .from('organizers')
          .select('*')
          .eq('username', slug)
          .eq('is_page_active', true)
          .maybeSingle();

        if (organizerError) throw organizerError;
        if (!organizerData) {
          navigate('/404');
          return;
        }

        // Verificar se é o próprio perfil
        if (user && organizerData.user_id === user.id) {
          setIsOwnProfile(true);
        } else {
          setIsOwnProfile(false);
        }

        // Verificar se já está seguindo
        if (user) {
          const { data: followData } = await supabase
            .from('followers')
            .select('id')
            .eq('user_id', user.id)
            .eq('organizer_id', organizerData.id)
            .maybeSingle();
          
          setIsFollowing(!!followData);
        }

        // Buscar perfil do usuário
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, bio')
          .eq('user_id', organizerData.user_id)
          .maybeSingle();

        // Buscar estatísticas
        const { data: statsData } = await supabase
          .from('organizer_stats')
          .select('*')
          .eq('organizer_id', organizerData.id)
          .maybeSingle();

        const organizerObj = {
          ...organizerData,
          profile: profileData || undefined,
          stats: statsData || { followers_count: 0, events_count: 0, average_rating: 0 }
        } as any;
        setOrganizer(organizerObj);

        // Buscar eventos públicos
        const { data: eventsData } = await supabase
          .from('events')
          .select('*')
          .eq('organizer_id', organizerData.id)
          .eq('status', 'upcoming')
          .order('event_date', { ascending: true });

        // Buscar estatísticas dos eventos
        const eventsWithStats = await Promise.all(
          (eventsData || []).map(async (event) => {
            const { count: likesCount } = await supabase
              .from('event_likes')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id);

            const { count: commentsCount } = await supabase
              .from('event_comments')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id);

            return {
              ...event,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
            };
          })
        );

        setEvents(eventsWithStats);

        // Buscar links customizados
        const { data: linksData } = await supabase
          .from('custom_links')
          .select('*')
          .eq('organizer_id', organizerData.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        setCustomLinks(linksData || []);
      } catch (error) {
        console.error('Error fetching organizer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizerData();
  }, [slug, user, navigate]);

  // Realtime updates para perfil do organizador
  useEffect(() => {
    if (!organizer) return;

    const channel = supabase
      .channel('realtime-public-organizer-profile')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'organizers',
        filter: `id=eq.${organizer.id}`
      }, (payload) => {
        const updated = payload.new as any;
        setOrganizer(prev => prev ? {
          ...prev,
          ...updated
        } : prev);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `user_id=eq.${organizer.user_id}`
      }, (payload) => {
        const updated = payload.new as any;
        setOrganizer(prev => prev ? {
          ...prev,
          profile: {
            display_name: updated.display_name,
            avatar_url: updated.avatar_url,
            bio: updated.bio
          }
        } : prev);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizer?.id, organizer?.user_id]);

  const handleFollow = async () => {
    if (!user) {
      // Redirect to login with current page as return url
      const currentPath = location.pathname;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!organizer) return;

    try {
      if (isFollowing) {
        // Deixar de seguir
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('user_id', user.id)
          .eq('organizer_id', organizer.id);

        if (error) throw error;

        setIsFollowing(false);
        toast.success('Você deixou de seguir este organizador');
      } else {
        // Seguir
        const { error } = await supabase
          .from('followers')
          .insert({
            user_id: user.id,
            organizer_id: organizer.id
          });

        if (error) throw error;

        setIsFollowing(true);
        toast.success('Você está seguindo este organizador!');
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast.error('Erro ao processar sua solicitação');
    }
  };

  const handleShare = () => {
    if (!organizer) return;
    
    const publicUrl = `${getPublicBaseUrl()}/${organizer.username}`;
    
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast.success('Link copiado!', {
        description: 'O link da página foi copiado para a área de transferência'
      });
    }).catch(() => {
      toast.error('Erro ao copiar link');
    });
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayName = days[date.getDay()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${dayName}, ${hours}:${minutes}`;
  };

  const tabs = [
    { id: "eventos", label: "Eventos", icon: Calendar },
    { id: "links", label: "Links", icon: ExternalLink },
    { id: "fotos", label: "Fotos", icon: Camera }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Organizador</h1>
          <div className="w-10" />
        </div>
        <div className="px-4 pb-6 text-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (!organizer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-primary/20 to-background">
        <div className="flex items-center justify-between p-4 relative z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground">
              Descubra mais eventos na sua cidade
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Profile Header */}
        <div className="px-4 pb-6 text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-background shadow-lg">
            {(organizer.avatar_url || organizer.profile?.avatar_url) ? (
              <AvatarImage src={organizer.avatar_url || organizer.profile?.avatar_url} alt={organizer.page_title} />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {organizer.page_title.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {organizer.profile?.display_name || organizer.page_title}
          </h2>
          {organizer.username && (
            <p className="text-sm text-muted-foreground mb-2">@{organizer.username}</p>
          )}
          <p className="text-muted-foreground max-w-sm mx-auto mb-4">
            {organizer.profile?.bio || organizer.page_description || 'Organizador de eventos'}
          </p>
          
          {/* Stats */}
          {organizer.show_statistics && (
            <div className="flex justify-center gap-6 mb-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {organizer.stats?.followers_count?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {organizer.stats?.events_count || events.length}
                </p>
                <p className="text-sm text-muted-foreground">Eventos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {organizer.stats?.average_rating?.toFixed(1) || '0.0'}
                </p>
                <p className="text-sm text-muted-foreground">Avaliação</p>
              </div>
            </div>
          )}

          {/* Follow & Share buttons */}
          {!isOwnProfile && (
            <div className="flex justify-center gap-3">
              <Button variant="glow" size="lg" className="flex-1 max-w-[200px]" onClick={handleFollow}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Button>
              <Button variant="outline" size="lg" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          )}
          
          {isOwnProfile && (
            <div className="flex justify-center">
              <Button variant="outline" size="lg" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar minha página
              </Button>
            </div>
          )}
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
        {activeTab === "eventos" && organizer.show_events && (
          <div className="space-y-4">
            {events.length > 0 ? (
              events.map((event) => (
                <Card key={event.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img 
                      src={event.image_url || '/placeholder.svg'} 
                      alt={event.title} 
                      className="w-full h-32 object-cover" 
                    />
                    {event.is_live && (
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
                      <span>{formatEventDate(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                      <Users className="h-3 w-3 ml-auto" />
                      <span>{event.current_attendees}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span>{event.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{event.comments_count || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum evento disponível no momento.</p>
              </div>
            )}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && organizer.show_contact && (
          <div className="space-y-3">
            {/* Social Links */}
            {organizer.show_whatsapp && organizer.whatsapp_url && (
              <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <a href={organizer.whatsapp_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 text-white">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">Entre em contato</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </CardContent>
              </Card>
            )}

            {organizer.show_instagram && organizer.instagram_url && (
              <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <a href={organizer.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white">
                      <Instagram className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Instagram</p>
                      <p className="text-sm text-muted-foreground">Siga no Instagram</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </CardContent>
              </Card>
            )}

            {organizer.show_playlist && organizer.playlist_url && (
              <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <a href={organizer.playlist_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-600 text-white">
                      <Music className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Playlist</p>
                      <p className="text-sm text-muted-foreground">Ouça nossa playlist</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </CardContent>
              </Card>
            )}

            {organizer.show_location && organizer.location_url && (
              <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <a href={organizer.location_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500 text-white">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Localização</p>
                      <p className="text-sm text-muted-foreground">Veja no mapa</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </CardContent>
              </Card>
            )}

            {organizer.show_website && organizer.website_url && (
              <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <a href={organizer.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Site</p>
                      <p className="text-sm text-muted-foreground">Visite nosso site</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Custom Links */}
            {customLinks.map((link) => (
              <Card key={link.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: link.color }}
                    >
                      {link.icon || link.title.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{link.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </CardContent>
              </Card>
            ))}

            {/* Empty state */}
            {!organizer.show_whatsapp && !organizer.show_instagram && !organizer.show_playlist && 
             !organizer.show_location && !organizer.show_website && customLinks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum link disponível.</p>
              </div>
            )}
          </div>
        )}

        {/* Fotos Tab */}
        {activeTab === "fotos" && (
          <div className="space-y-6">
            {allEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma foto adicionada ainda.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    As fotos dos eventos aparecerão aqui quando forem adicionadas pelo organizador.
                  </p>
                </div>
              </div>
            ) : (
              allEvents.map((event) => (
                <div key={event.id} className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.event_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <EventPhotoGrid eventId={event.id} organizerId={organizer.id} />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 pb-6 text-center border-t border-border pt-6">
        <p className="text-xs text-muted-foreground">
          Esse site foi desenvolvido pela <a href="https://flatgrowth.com.br/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Flat Company</a>
        </p>
      </footer>
    </div>
  );
}
