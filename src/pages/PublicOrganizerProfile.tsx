import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Users, ExternalLink, MessageCircle, Camera, Music, MapPin, Calendar, Heart, Instagram, Globe, Share2, Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getPublicBaseUrl } from "@/config/site";

// Componente auxiliar para fotos de evento
function EventPhotoGrid({ eventId, organizerId }: { eventId: string; organizerId: string }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
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

  const handlePhotoClick = (index: number) => {
    if (!user) {
      const currentPath = location.pathname;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      toast.info('Faça login para ver as fotos ampliadas');
      return;
    }
    setCurrentPhotoIndex(index);
    setViewerOpen(true);
  };

  const handleGalleryClick = () => {
    if (!user) {
      const currentPath = location.pathname;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      toast.info('Faça login para ver todas as fotos');
      return;
    }
    setGalleryOpen(true);
  };

  const handleGalleryPhotoClick = (index: number) => {
    setCurrentPhotoIndex(index);
    setGalleryOpen(false);
    setViewerOpen(true);
  };

  const handleDownload = async (photoUrl: string, photoCaption: string) => {
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

  const goToPrevious = () => {
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const displayedPhotos = photos.slice(0, 3);
  const remainingCount = photos.length - 3;

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {displayedPhotos.map((photo, index) => (
          <div 
            key={photo.id} 
            className="aspect-square bg-surface rounded-lg overflow-hidden relative group cursor-pointer"
            onClick={() => handlePhotoClick(index)}
          >
            <img 
              src={photo.photo_url} 
              alt={photo.caption || "Foto do evento"} 
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        ))}
        {remainingCount > 0 && (
          <div 
            className="aspect-square bg-surface rounded-lg overflow-hidden relative cursor-pointer"
            onClick={handleGalleryClick}
          >
            <img 
              src={photos[3].photo_url} 
              alt="Mais fotos" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 hover:bg-black/70 transition-colors flex items-center justify-center">
              <span className="text-white font-bold text-2xl">+{remainingCount + 1}</span>
            </div>
          </div>
        )}
      </div>

      {/* Gallery Dialog */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Todas as fotos ({photos.length})</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGalleryOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="aspect-square bg-surface rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleGalleryPhotoClick(index)}
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || `Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setViewerOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Download button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-16 z-50 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => handleDownload(photos[currentPhotoIndex].photo_url, photos[currentPhotoIndex].caption)}
            >
              <Download className="h-6 w-6" />
            </Button>

            {/* Previous button */}
            {photos.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 bg-black/50 hover:bg-black/70 text-white"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Next button */}
            {photos.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Photo */}
            <img
              src={photos[currentPhotoIndex]?.photo_url}
              alt={photos[currentPhotoIndex]?.caption || "Foto do evento"}
              className="max-h-full max-w-full object-contain"
            />

            {/* Photo counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {currentPhotoIndex + 1} / {photos.length}
            </div>

            {/* Caption */}
            {photos[currentPhotoIndex]?.caption && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg text-sm max-w-md text-center">
                {photos[currentPhotoIndex].caption}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
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
  preferred_theme?: 'dark' | 'light';
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

        // Aplicar o tema do organizador IMEDIATAMENTE
        const organizerTheme = organizerData.preferred_theme || 'dark';
        const root = document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(organizerTheme);

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

    // Cleanup: restaurar tema ao sair da página
    return () => {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(savedTheme);
    };
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
      {/* Header com capa de fundo */}
      <div 
        className="relative h-[200px] overflow-hidden"
        style={{
          backgroundImage: organizer.cover_image_url 
            ? `url(${organizer.cover_image_url})`
            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 25%, hsl(220 70% 50%) 50%, hsl(200 70% 50%) 75%, hsl(var(--primary) / 0.6) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay escuro sobre toda a capa para dar contraste */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 0
          }}
        />
        
        {/* Gradiente suave de transição na parte inferior */}
        <div 
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '120px',
            background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.95) 40%, transparent 100%)',
            zIndex: 1
          }}
        />
        
        <div className="flex items-center justify-between p-4 relative" style={{ zIndex: 10 }}>
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="bg-black/20 hover:bg-black/40 backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <h1 className="text-lg font-semibold text-white">Organizador</h1>
          <Button variant="ghost" size="icon" onClick={handleShare} className="bg-black/20 hover:bg-black/40 backdrop-blur-sm">
            <Share2 className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Profile Info - fora da área da capa */}
      <div className="px-4 pb-6 text-center -mt-24 relative z-10">
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
                Compartilhar
              </Button>
            </div>
          )}
          
          {isOwnProfile && (
            <div className="flex justify-center">
              <Button variant="outline" size="lg" className="bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white border-white/20" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar minha página
            </Button>
          </div>
        )}
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
