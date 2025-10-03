import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Users, ExternalLink, MessageCircle, Camera, Music, MapPin, Calendar, Heart, Instagram, Globe, Share2, Download, Upload, UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizerDetails, OrganizerEvent } from "@/hooks/useOrganizerDetails";
import { useOrganizer } from "@/hooks/useOrganizer";
import { useFollowers } from "@/hooks/useFollowers";
import { toast } from "sonner";
import { getPublicBaseUrl } from "@/config/site";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Componente auxiliar para fotos de evento
function EventPhotoGrid({ eventId, organizerId }: { eventId: string; organizerId: string }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const { data, error } = await supabase
          .from('organizer_photos')
          .select('*')
          .eq('organizer_id', organizerId)
          .eq('event_id', eventId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
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

interface OrganizerProfileProps {
  onBack: () => void;
  organizerId?: string;
  onEventClick?: (eventId: string) => void;
}

export default function OrganizerProfile({ onBack, organizerId, onEventClick }: OrganizerProfileProps) {
  const [activeTab, setActiveTab] = useState("eventos");
  const [allEvents, setAllEvents] = useState<OrganizerEvent[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [removingCover, setRemovingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { organizer, events, customLinks, loading } = useOrganizerDetails(organizerId);
  const { updateOrganizerProfile } = useOrganizer();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isFollowing, loading: followLoading, toggleFollow } = useFollowers(organizerId);

  // Buscar todos os eventos para a aba de fotos
  useEffect(() => {
    const fetchAllEvents = async () => {
      if (!organizerId) return;
      
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', organizerId)
        .order('event_date', { ascending: false });
      
      setAllEvents(eventsData || []);
    };
    
    if (activeTab === 'fotos') {
      fetchAllEvents();
    }
  }, [organizerId, activeTab]);

  const handleShare = () => {
    if (!organizer) return;
    
    // Gerar URL pública usando apenas o username
    const publicUrl = `${getPublicBaseUrl()}/${organizer.username}`;
    
    // Copiar para clipboard
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast.success('Link copiado!', {
        description: 'O link da página foi copiado para a área de transferência'
      });
    }).catch(() => {
      toast.error('Erro ao copiar link');
    });
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingCover(true);

      // Verificar se é um formato de imagem suportado
      const fileType = file.type.toLowerCase();
      const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      
      if (!supportedFormats.includes(fileType)) {
        toast.error('Formato não suportado', {
          description: 'Por favor, use imagens JPG, PNG ou WEBP. Se você está no iPhone, abra a foto no app Fotos e compartilhe > Salvar imagem para converter automaticamente para JPG.'
        });
        setUploadingCover(false);
        return;
      }

      // Validar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande', {
          description: 'A imagem deve ter no máximo 5MB'
        });
        setUploadingCover(false);
        return;
      }

      // Upload para o Supabase Storage
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const timestamp = Date.now();
      const fileName = `${user.id}/cover-${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName);

      // Atualizar perfil do organizador
      await updateOrganizerProfile({ cover_image_url: publicUrl });
      
      toast.success('Capa atualizada com sucesso!');
      
      // Recarregar dados
      window.location.reload();
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Erro ao atualizar capa');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!user) return;

    try {
      setRemovingCover(true);
      
      // Remover URL da capa do perfil
      await updateOrganizerProfile({ cover_image_url: null });
      
      toast.success('Capa removida com sucesso!');
      
      // Recarregar dados
      window.location.reload();
    } catch (error) {
      console.error('Error removing cover:', error);
      toast.error('Erro ao remover capa');
    } finally {
      setRemovingCover(false);
    }
  };

  // Função auxiliar para formatizar data
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayName = days[date.getDay()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${dayName}, ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Organizador</h1>
        </div>
        <div className="px-4 pb-6 text-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <div className="flex justify-center gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-6 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Organizador não encontrado</p>
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "eventos", label: "Eventos", icon: Calendar },
    { id: "links", label: "Links", icon: ExternalLink },
    { id: "fotos", label: "Fotos", icon: Camera }
  ];

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
          <Button variant="ghost" size="icon" onClick={onBack} className="bg-black/20 hover:bg-black/40 backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <h1 className="text-lg font-semibold text-white">Organizador</h1>
          <Button variant="ghost" size="icon" onClick={handleShare} className="bg-black/20 hover:bg-black/40 backdrop-blur-sm">
            <Share2 className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Botão para alterar capa (visível apenas para o próprio organizador) */}
        {user && organizer.user_id === user.id && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleCoverUpload}
              className="hidden"
            />
            <div className="absolute top-4 right-4 flex gap-2" style={{ zIndex: 10 }}>
              {organizer.cover_image_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveCover}
                  disabled={removingCover}
                  className="bg-red-500/80 hover:bg-red-600/90 backdrop-blur-sm text-white"
                  title="Remover capa"
                >
                  {removingCover ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingCover}
                className="bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white"
                title={organizer.cover_image_url ? "Alterar capa" : "Adicionar capa"}
              >
                {uploadingCover ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </Button>
            </div>
          </>
        )}
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
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {organizer.profile?.display_name || organizer.page_title}
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto mb-4">
          {organizer.profile?.bio || organizer.page_description || 'Organizador de eventos'}
        </p>
        
        {/* Stats */}
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

        {/* Follow button */}
        {!user || (organizer.user_id !== user.id) ? (
          <div className="flex justify-center gap-3">
            <Button 
              variant="glow" 
              size="lg" 
              className="flex-1 max-w-[200px]" 
              onClick={async () => {
                if (!user) {
                  const currentPath = location.pathname;
                  navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
                } else {
                  await toggleFollow();
                }
              }}
              disabled={followLoading}
            >
              {followLoading ? (
                'Carregando...'
              ) : isFollowing ? (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Seguindo
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Seguir
                </>
              )}
            </Button>
            <Button variant="outline" size="lg" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button variant="outline" size="lg" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar minha página
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6 -mt-4 relative" style={{ zIndex: 10 }}>
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
            {events.length > 0 ? (
              events.map((event) => (
                <Card 
                  key={event.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onEventClick?.(event.id)}
                >
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
                <p className="text-muted-foreground">Nenhum evento criado ainda.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Os eventos aparecerão aqui assim que forem criados.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && (
          <div className="space-y-3">
            {/* Social Links */}
            {organizer.show_whatsapp && organizer.whatsapp_url && (
              <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <a
                    href={organizer.whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full"
                  >
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
                  <a
                    href={organizer.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full"
                  >
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
                  <a
                    href={organizer.playlist_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full"
                  >
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
                  <a
                    href={organizer.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full"
                  >
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
                  <a
                    href={organizer.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full"
                  >
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
            {customLinks.length > 0 && customLinks.map((link) => (
              <Card key={link.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full"
                  >
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
                <p className="text-muted-foreground">Nenhum link adicionado ainda.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Os links aparecerão aqui quando forem adicionados.
                </p>
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
                  <p className="text-muted-foreground">O organizador ainda não adicionou fotos.</p>
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