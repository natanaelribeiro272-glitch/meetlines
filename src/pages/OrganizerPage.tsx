import { useState, useEffect, useRef } from "react";
import { Edit3, Share2, MapPin, Upload, User, Settings, List, Camera, Instagram, Phone, Music, Globe, Image, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizer } from "@/hooks/useOrganizer";
import { useOrganizerPhotos } from "@/hooks/useOrganizerPhotos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OrganizerEventsList from "@/components/OrganizerEventsList";
import OrganizerSettings from "@/components/OrganizerSettings";
import CreateEvent from "@/pages/CreateEvent";

export default function OrganizerPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showAddPhotos, setShowAddPhotos] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [sessionName, setSessionName] = useState("");
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
    description: ""
  });
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
        description: organizerData.page_description || ""
      });
    }
  }, [organizerData]);

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
    followers: 1250,
    events: events.length,
    pageViews: 8450
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

      await updateOrganizerProfile({ avatar_url: publicUrl });
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/${organizerData?.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência!');
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const success = await uploadPhotos(files, sessionName);
    if (success) {
      setShowAddPhotos(false);
      setSessionName("");
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
              <header className="relative h-64 bg-gradient-to-b from-surface to-background rounded-lg overflow-hidden">
                {organizerData?.cover_image_url ? (
                  <img src={organizerData?.cover_image_url} alt="Cover" className="w-full h-full object-cover opacity-30" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <input type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" id="cover-upload" />
                  <label htmlFor="cover-upload">
                    <Button variant="ghost" size="icon" className="bg-surface/80 backdrop-blur-sm cursor-pointer" disabled={isUploadingCover}>
                      {isUploadingCover ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
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
                  </div>
                  
                  <div className="flex-1 pb-2 space-y-2">
                    <Input
                      value={editableProfile.title}
                      onChange={(e) => setEditableProfile(prev => ({ ...prev, title: e.target.value }))}
                      className="text-xl font-bold bg-transparent border-border"
                      placeholder="Nome do perfil"
                    />
                    <Input
                      value={editableProfile.description}
                      onChange={(e) => setEditableProfile(prev => ({ ...prev, description: e.target.value }))}
                      className="text-sm bg-transparent border-border"
                      placeholder="Descrição"
                    />
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={async () => {
                    await updateOrganizerProfile({
                      page_title: editableProfile.title,
                      page_description: editableProfile.description
                    });
                    toast.success('Perfil atualizado com sucesso!');
                  }}>
                    <Edit3 className="h-4 w-4" />
                    Salvar
                  </Button>
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
                </div>
              </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <OrganizerEventsList onCreateEvent={() => setShowCreateEvent(true)} />
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
                          <h3 className="font-semibold text-foreground">{session.sessionName}</h3>
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
              <DialogTitle>Adicionar Fotos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="session-name">Nome da Sessão</Label>
                <Input 
                  id="session-name" 
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Ex: Festival de Música 2024"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nome para agrupar as fotos
                </p>
              </div>
              <div>
                <Label htmlFor="photos-upload">Selecionar Fotos</Label>
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
                  setSessionName("");
                }} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
