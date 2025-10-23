import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Edit3, Share2, MapPin, Upload, User, Settings, List, Camera, Instagram, Phone, Music, Globe, Image, Trash2, ExternalLink, DollarSign } from "lucide-react";
import OrganizerFinancial from "@/components/OrganizerFinancial";
import TicketSalesOverview from "@/components/TicketSalesOverview";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizer } from "@/hooks/useOrganizer";
import { useOrganizerPhotos } from "@/hooks/useOrganizerPhotos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OrganizerEventsList from "@/components/OrganizerEventsList";
import OrganizerSettings from "@/components/OrganizerSettings";
import CreateEvent from "@/pages/CreateEvent";
import EventRegistrations from "@/pages/EventRegistrations";
import EventAttendances from "@/pages/EventAttendances";
import { getPublicBaseUrl } from "@/config/site";

export default function OrganizerPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [showAttendances, setShowAttendances] = useState(false);
  const [selectedEventIdForRegistrations, setSelectedEventIdForRegistrations] = useState<string | null>(null);
  const [selectedEventIdForAttendances, setSelectedEventIdForAttendances] = useState<string | null>(null);
  const [showAddPhotos, setShowAddPhotos] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [stats, setStats] = useState({
    followers_count: 0,
    events_count: 0,
    page_views: 0
  });
  const photoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileForm, setProfileForm] = useState({
    bio: "",
    instagram: "",
    website: ""
  });
  const [pageSettings, setPageSettings] = useState({
    title: "",
    subtitle: "",
    description: "",
    primaryColor: "#8B5CF6",
    showStats: true,
    showEvents: true,
    showContact: true
  });
  const [editableProfile, setEditableProfile] = useState({
    title: "",
    description: "",
    username: ""
  });
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [defaultLinks, setDefaultLinks] = useState({
    instagram: { url: "", visible: false },
    whatsapp: { url: "", visible: false },
    location: { url: "", visible: false },
    playlist: { url: "", visible: false },
    website: { url: "", visible: false }
  });

  const { user } = useAuth();
  const { organizerData, events, customLinks, loading, updateOrganizerProfile } = useOrganizer();
  const { photoSessions, loading: photosLoading, uploadPhotos, deletePhoto } = useOrganizerPhotos();

  useEffect(() => {
    if (organizerData) {
      // Buscar estatísticas reais do organizador
      const fetchStats = async () => {
        const { data: statsData } = await supabase
          .from('organizer_stats')
          .select('*')
          .eq('organizer_id', organizerData.id)
          .maybeSingle();

        if (statsData) {
          setStats({
            followers_count: statsData.followers_count || 0,
            events_count: events.length, // Usar o número real de eventos
            page_views: 0 // Por enquanto 0, pode ser implementado com analytics
          });
        } else {
          // Se não houver stats, usar valores padrão
          setStats({
            followers_count: 0,
            events_count: events.length,
            page_views: 0
          });
        }
      };
      
      fetchStats();
      setPageSettings({
        title: organizerData.page_title || "",
        subtitle: organizerData.page_subtitle || "",
        description: organizerData.page_description || "",
        primaryColor: organizerData.primary_color || "#8B5CF6",
        showStats: organizerData.show_statistics,
        showEvents: organizerData.show_events,
        showContact: organizerData.show_contact
      });
      setEditableProfile({
        title: organizerData.page_title || "",
        description: organizerData.page_description || "",
        username: organizerData.username || ""
      });
    }
  }, [organizerData, events]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const organizer = {
    name: organizerData?.page_title || "Meu Perfil",
    bio: organizerData?.page_description || "Organizador de eventos",
    followers: stats.followers_count,
    events: stats.events_count,
    pageViews: stats.page_views
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizerData || !user) return;

    try {
      setIsUploadingCover(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/cover.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName);

      await updateOrganizerProfile({ cover_image_url: publicUrl });
      toast.success('Imagem de capa atualizada!');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizerData || !user) return;

    try {
      setIsUploadingAvatar(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName);

      // Atualizar em ambas as tabelas
      await updateOrganizerProfile({ avatar_url: publicUrl });
      
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);
      
      toast.success('Foto de perfil atualizada em todos os lugares!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleShareLink = async () => {
    if (!organizerData?.username) {
      toast.error('Configuração de username necessária');
      return;
    }

    const url = `${window.location.origin}/${organizerData.username}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: organizerData.page_title || 'Meu perfil',
          text: 'Confira meu perfil de organizador',
          url: url,
        });
        return;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand("copy");
        toast.success('Link copiado!');
      } catch (err) {
        toast.error('Não foi possível copiar o link');
      }

      document.body.removeChild(textarea);
    }
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (!selectedEventId) {
      toast.error('Selecione um evento para associar as fotos');
      return;
    }

    const success = await uploadPhotos(files, selectedEventId);
    if (success) {
      setShowAddPhotos(false);
      setSelectedEventId("");
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          bio: profileForm.bio,
          instagram_url: profileForm.instagram,
          website: profileForm.website
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  if (showCreateEvent) {
    return <CreateEvent onBack={() => setShowCreateEvent(false)} />;
  }

  if (showRegistrations) {
    return <EventRegistrations onBack={() => setShowRegistrations(false)} eventId={selectedEventIdForRegistrations || undefined} />;
  }

  if (showAttendances) {
    return <EventAttendances onBack={() => setShowAttendances(false)} eventId={selectedEventIdForAttendances || undefined} />;
  }

  // Profile tab content
  const ProfileContent = () => <div className="space-y-6">
      {/* Header */}
      <header className="relative h-64 bg-gradient-to-b from-surface to-background rounded-lg overflow-hidden">
        {organizerData?.cover_image_url ? <img src={organizerData?.cover_image_url} alt="Cover" className="w-full h-full object-cover opacity-30" /> : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="absolute top-4 right-4 flex gap-2">
          <input type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" id="cover-upload" />
          <label htmlFor="cover-upload">
            <Button variant="ghost" size="icon" className="bg-surface/80 backdrop-blur-sm cursor-pointer" disabled={isUploadingCover}>
              {isUploadingCover ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="h-5 w-5" />}
            </Button>
          </label>
          <Button variant="ghost" size="icon" className="bg-surface/80 backdrop-blur-sm" onClick={handleShareLink}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Profile Section */}
      <div className="-mt-16 relative z-10">
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
          
          <Button variant="outline" size="sm" onClick={async () => {
          await updateOrganizerProfile({
            page_title: pageSettings.title,
            page_subtitle: pageSettings.subtitle,
            page_description: pageSettings.description,
            primary_color: pageSettings.primaryColor,
            show_statistics: pageSettings.showStats,
            show_events: pageSettings.showEvents,
            show_contact: pageSettings.showContact
          });
          toast.success('Configurações salvas com sucesso!');
        }}>
            <Edit3 className="h-4 w-4" />
            Salvar
          </Button>
        </div>

        {/* Stats */}
        {pageSettings.showStats && <div className="flex items-center justify-around py-4 mb-6 bg-card rounded-lg">
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
          </div>}
      </div>
    </div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Fotos
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="space-y-6">
              {/* Header */}
              <header className={`relative h-64 bg-gradient-to-b from-surface to-background rounded-lg overflow-hidden ${isEditing ? 'group cursor-pointer' : ''}`}>
                {isEditing && (
                  <>
                    <input type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" id="cover-upload" />
                    <label htmlFor="cover-upload" className="absolute inset-0 cursor-pointer">
                      {organizerData?.cover_image_url ? (
                        <img src={organizerData?.cover_image_url} alt="Cover" className="w-full h-full object-cover opacity-30" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUploadingCover ? (
                          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <div className="text-white text-center">
                            <Camera className="h-12 w-12 mx-auto mb-2" />
                            <p className="text-sm font-medium">Clique para alterar a capa</p>
                          </div>
                        )}
                      </div>
                    </label>
                  </>
                )}
                {!isEditing && (
                  <>
                    {organizerData?.cover_image_url ? (
                      <img src={organizerData?.cover_image_url} alt="Cover" className="w-full h-full object-cover opacity-30" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
                  </>
                )}
                
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <Button variant="ghost" size="icon" className="bg-surface/80 backdrop-blur-sm" onClick={handleShareLink}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </header>

              {/* Profile Section */}
              <div className="-mt-16 relative z-10">
                <div className="flex items-end gap-4 mb-4">
                  <div className="avatar-story relative group">
                    <Avatar className="h-20 w-20 border-4 border-background">
                      {organizerData?.avatar_url ? (
                        <img src={organizerData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-surface text-lg font-bold">
                          {editableProfile.title.charAt(0) || 'O'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {isEditing && (
                      <>
                        <input 
                          type="file" 
                          accept="image/*" 
                          ref={avatarInputRef}
                          onChange={handleAvatarUpload} 
                          className="hidden" 
                          id="avatar-upload" 
                        />
                        <label 
                          htmlFor="avatar-upload"
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          {isUploadingAvatar ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5 text-white" />
                          )}
                        </label>
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1 pb-2 space-y-2">
                    {isEditing ? (
                      <>
                        <Input
                          value={editableProfile.title}
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, title: e.target.value }))}
                          className="text-xl font-bold bg-transparent border-border"
                          placeholder="Nome do perfil"
                        />
                        <div className="space-y-1">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                            <Input
                              value={editableProfile.username}
                              onChange={async (e) => {
                                const newUsername = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
                                setEditableProfile(prev => ({ ...prev, username: newUsername }));
                                
                                if (newUsername.length >= 3 && newUsername !== organizerData?.username) {
                                  setIsCheckingUsername(true);
                                  setUsernameError(null);
                                  
                                  const { data, error } = await supabase.rpc('check_username_available', {
                                    username_to_check: newUsername,
                                    current_organizer_id: organizerData?.id
                                  });
                                  
                                  setIsCheckingUsername(false);
                                  
                                  if (error) {
                                    setUsernameError('Erro ao verificar username');
                                  } else if (!data) {
                                    setUsernameError('Username já está em uso');
                                  }
                                }
                              }}
                              className="text-sm bg-transparent border-border pl-7"
                              placeholder="username"
                            />
                          </div>
                          {isCheckingUsername && (
                            <p className="text-xs text-muted-foreground">Verificando disponibilidade...</p>
                          )}
                          {usernameError && (
                            <p className="text-xs text-destructive">{usernameError}</p>
                          )}
                          {!usernameError && !isCheckingUsername && editableProfile.username && editableProfile.username !== organizerData?.username && (
                            <p className="text-xs text-green-600">Username disponível!</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Mínimo 3 caracteres. Apenas letras minúsculas, números, ponto e underline.
                          </p>
                        </div>
                        <Textarea
                          value={editableProfile.description}
                          onChange={(e) => setEditableProfile(prev => ({ ...prev, description: e.target.value }))}
                          className="text-sm bg-transparent border-border min-h-[60px]"
                          placeholder="Descrição"
                        />
                      </>
                    ) : (
                      <>
                        <h1 className="text-xl font-bold text-foreground">{editableProfile.title || 'Seu Nome'}</h1>
                        {organizerData?.username && (
                          <p className="text-sm text-muted-foreground">@{organizerData.username}</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Botão para visualizar página pública */}
                  {organizerData?.username && !isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`${getPublicBaseUrl()}/${organizerData.username}`, '_blank')}
                      className="mb-2"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Página
                    </Button>
                  )}
                 </div>
                   
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        disabled={!!usernameError || isCheckingUsername || editableProfile.username.length < 3}
                        onClick={async () => {
                        try {
                          // Validar username antes de salvar
                          if (editableProfile.username !== organizerData?.username) {
                            const { data: isAvailable, error: checkError } = await supabase.rpc('check_username_available', {
                              username_to_check: editableProfile.username,
                              current_organizer_id: organizerData?.id
                            });
                            
                            if (checkError || !isAvailable) {
                              toast.error('Username já está em uso');
                              return;
                            }
                          }
                          
                          // Atualizar na tabela organizers
                          await updateOrganizerProfile({
                            page_title: editableProfile.title,
                            page_description: editableProfile.description,
                            username: editableProfile.username
                          });
                          
                          // Atualizar também na tabela profiles para sincronizar
                          if (user) {
                            await supabase
                              .from('profiles')
                              .update({
                                display_name: editableProfile.title,
                                bio: editableProfile.description
                              })
                              .eq('user_id', user.id);
                          }
                          
                          setIsEditing(false);
                          setUsernameError(null);
                        } catch (error) {
                          console.error('Error updating profile:', error);
                          // O toast de erro já foi mostrado pelo updateOrganizerProfile
                        }
                      }}>
                        Salvar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditableProfile({
                          title: organizerData?.page_title || "",
                          description: organizerData?.page_description || "",
                          username: organizerData?.username || ""
                        });
                        setUsernameError(null);
                        setIsEditing(false);
                      }}>
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {pageSettings.showStats && (
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
                )}

                {/* Social Links Section */}
                <div className="space-y-4 bg-card rounded-lg p-4">
                  <h3 className="font-semibold text-foreground">Links Sociais</h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="whatsapp" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          WhatsApp
                        </Label>
                        <Switch 
                          checked={organizerData?.show_whatsapp}
                          onCheckedChange={async (checked) => {
                            await updateOrganizerProfile({ show_whatsapp: checked });
                          }}
                        />
                      </div>
                      <Input 
                        id="whatsapp"
                        placeholder="https://wa.me/..."
                        value={organizerData?.whatsapp_url || ""}
                        onChange={(e) => updateOrganizerProfile({ whatsapp_url: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="instagram" className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          Instagram
                        </Label>
                        <Switch 
                          checked={organizerData?.show_instagram}
                          onCheckedChange={async (checked) => {
                            await updateOrganizerProfile({ show_instagram: checked });
                          }}
                        />
                      </div>
                      <Input 
                        id="instagram"
                        placeholder="https://instagram.com/..."
                        value={organizerData?.instagram_url || ""}
                        onChange={(e) => updateOrganizerProfile({ instagram_url: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="playlist" className="flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Playlist
                        </Label>
                        <Switch 
                          checked={organizerData?.show_playlist}
                          onCheckedChange={async (checked) => {
                            await updateOrganizerProfile({ show_playlist: checked });
                          }}
                        />
                      </div>
                      <Input 
                        id="playlist"
                        placeholder="https://open.spotify.com/..."
                        value={organizerData?.playlist_url || ""}
                        onChange={(e) => updateOrganizerProfile({ playlist_url: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="location" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Localização
                        </Label>
                        <Switch 
                          checked={organizerData?.show_location}
                          onCheckedChange={async (checked) => {
                            await updateOrganizerProfile({ show_location: checked });
                          }}
                        />
                      </div>
                      <Input 
                        id="location"
                        placeholder="https://maps.google.com/..."
                        value={organizerData?.location_url || ""}
                        onChange={(e) => updateOrganizerProfile({ location_url: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="website" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Website
                        </Label>
                        <Switch 
                          checked={organizerData?.show_website}
                          onCheckedChange={async (checked) => {
                            await updateOrganizerProfile({ show_website: checked });
                          }}
                        />
                      </div>
                      <Input 
                        id="website"
                        placeholder="https://seusite.com"
                        value={organizerData?.website_url || ""}
                        onChange={(e) => updateOrganizerProfile({ website_url: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Categoria Section */}
                <div className="space-y-4 bg-card rounded-lg p-4">
                  <h3 className="font-semibold text-foreground">Categoria do Perfil</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={organizerData?.category || ""}
                      onValueChange={(value) => updateOrganizerProfile({ category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="festas">Festas</SelectItem>
                        <SelectItem value="eventos">Eventos</SelectItem>
                        <SelectItem value="encontros">Encontros</SelectItem>
                        <SelectItem value="lives">Lives</SelectItem>
                        <SelectItem value="geek">Geek</SelectItem>
                        <SelectItem value="esporte">Esporte</SelectItem>
                        <SelectItem value="saúde">Saúde</SelectItem>
                        <SelectItem value="igreja">Igreja</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      A categoria ajuda os usuários a encontrar seu perfil
                    </p>
                  </div>
                </div>
              </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="p-4 md:p-6 space-y-6">
              <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-foreground">Gestão Financeira</h3>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      Visão consolidada de todos os seus eventos, vendas de ingressos e repasses
                    </p>
                  </div>
                  <Button
                    variant="default"
                    size="default"
                    className="w-full md:w-auto md:min-w-[120px] bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        window.open(window.location.origin + '/organizer-financial', '_blank');
                      } else {
                        navigate('/organizer-financial');
                      }
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Acessar
                  </Button>
                </div>
              </div>
            </div>
            <OrganizerEventsList
              onCreateEvent={() => setShowCreateEvent(true)}
              onManageRegistrations={(eventId) => {
                setSelectedEventIdForRegistrations(eventId);
                setShowRegistrations(true);
              }}
              onViewAttendances={(eventId) => {
                setSelectedEventIdForAttendances(eventId);
                setShowAttendances(true);
              }}
            />
          </TabsContent>

          <TabsContent value="photos" className="space-y-6 p-4">
            <div className="space-y-6">
              {/* Header da seção de fotos */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Minhas Fotos</h2>
                <Button variant="outline" size="sm" onClick={() => setShowAddPhotos(true)}>
                  <Camera className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {photosLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando fotos...</p>
                </div>
              ) : photoSessions.length > 0 ? (
                <div className="space-y-6">
                  {photoSessions.map((session, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{session.eventName || 'Sem evento'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {session.photos.length} foto{session.photos.length !== 1 ? 's' : ''} • {session.date}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {session.photos.slice(0, 3).map((photo) => (
                          <div key={photo.id} className="aspect-square bg-surface rounded-lg overflow-hidden relative group">
                            <img 
                              src={photo.photo_url} 
                              alt={photo.caption || "Foto do evento"} 
                              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                              onClick={() => deletePhoto(photo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {session.photos.length > 3 && (
                          <div className="aspect-square bg-surface rounded-lg overflow-hidden relative">
                            <img 
                              src={session.photos[3].photo_url} 
                              alt="Mais fotos" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">+{session.photos.length - 3}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-surface rounded-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Nenhuma foto ainda</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adicione fotos dos seus eventos para mostrar seu trabalho
                    </p>
                    <Button variant="outline" onClick={() => setShowAddPhotos(true)}>
                      <Camera className="h-4 w-4 mr-2" />
                      Adicionar Primeira Foto
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <OrganizerSettings />
          </TabsContent>
        </Tabs>

        {/* Dialog para adicionar fotos */}
        <Dialog open={showAddPhotos} onOpenChange={setShowAddPhotos}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Fotos do Evento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-select">Evento *</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum evento cadastrado
                      </SelectItem>
                    ) : (
                      events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  As fotos serão associadas a este evento
                </p>
              </div>
              <div>
                <Label htmlFor="photos-upload">Selecionar Fotos *</Label>
                <Input 
                  ref={photoInputRef}
                  id="photos-upload" 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handlePhotosUpload}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Você pode selecionar várias fotos de uma vez
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setShowAddPhotos(false);
                  setSelectedEventId("");
                }} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
