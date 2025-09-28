import { useState, useEffect } from "react";
import { Edit3, Share2, MapPin, Calendar, Eye, MoreHorizontal, User, Settings, Palette, Home, List, Upload, Plus, Camera, Instagram, Phone, Music, Globe, Type, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizer } from "@/hooks/useOrganizer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OrganizerEventsList from "@/components/OrganizerEventsList";
import OrganizerSettings from "@/components/OrganizerSettings";
import CreateEvent from "@/pages/CreateEvent";
import event1 from "@/assets/event-1.jpg";

export default function OrganizerPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showAddPhotos, setShowAddPhotos] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [profileForm, setProfileForm] = useState({ bio: "", instagram: "", website: "" });
  const [pageSettings, setPageSettings] = useState({
    title: "",
    subtitle: "",
    description: "",
    primaryColor: "#8B5CF6",
    showStats: true,
    showEvents: true,
    showContact: true,
  });
  const [defaultLinks, setDefaultLinks] = useState({
    instagram: { url: "", visible: false },
    whatsapp: { url: "", visible: false },
    location: { url: "", visible: false },
    playlist: { url: "", visible: false },
    website: { url: "", visible: false },
  });
  const { user } = useAuth();
  const { organizerData, events, customLinks, loading, updateOrganizerProfile, addCustomLink } = useOrganizer();

  useEffect(() => {
    if (organizerData) {
      setPageSettings({
        title: organizerData.page_title || "",
        subtitle: organizerData.page_subtitle || "",
        description: organizerData.page_description || "",
        primaryColor: organizerData.primary_color || "#8B5CF6",
        showStats: organizerData.show_statistics,
        showEvents: organizerData.show_events,
        showContact: organizerData.show_contact,
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
    pageViews: 8450,
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizerData) return;

    try {
      setIsUploadingCover(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizerData.id}/cover.${fileExt}`;
      
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

  const handleShareLink = () => {
    const url = `${window.location.origin}/${organizerData?.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência!');
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !organizerData) return;

    try {
      setIsUploadingPhotos(true);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${organizerData.id}/photos/${Date.now()}-${i}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
      }

      toast.success('Fotos enviadas com sucesso!');
      setShowAddPhotos(false);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Erro ao fazer upload das fotos');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      // Atualizar perfil na tabela profiles
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
  const ProfileContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <header className="relative h-64 bg-gradient-to-b from-surface to-background rounded-lg overflow-hidden">
        {organizerData?.cover_image_url ? (
          <img
            src={organizerData?.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="absolute top-4 right-4 flex gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverImageUpload}
            className="hidden"
            id="cover-upload"
          />
          <label htmlFor="cover-upload">
            <Button
              variant="ghost"
              size="icon"
              className="bg-surface/80 backdrop-blur-sm cursor-pointer"
              disabled={isUploadingCover}
            >
              {isUploadingCover ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </Button>
          </label>
          <Button
            variant="ghost"
            size="icon"
            className="bg-surface/80 backdrop-blur-sm"
            onClick={handleShareLink}
          >
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
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              await updateOrganizerProfile({
                page_title: pageSettings.title,
                page_subtitle: pageSettings.subtitle,
                page_description: pageSettings.description,
                primary_color: pageSettings.primaryColor,
                show_statistics: pageSettings.showStats,
                show_events: pageSettings.showEvents,
                show_contact: pageSettings.showContact,
              });
              toast.success('Configurações salvas com sucesso!');
            }}
          >
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

        {/* Configurações de Página */}
        <div className="mb-6 space-y-4">
          <h3 className="font-semibold text-foreground">Configurações da Página</h3>
          
          <div className="p-4 bg-card rounded-lg space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Título da Página</label>
              <input
                type="text"
                value={pageSettings.title}
                onChange={(e) => setPageSettings({...pageSettings, title: e.target.value})}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                placeholder="Nome do organizador/empresa"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground">Subtítulo</label>
              <input
                type="text"
                value={pageSettings.subtitle}
                onChange={(e) => setPageSettings({...pageSettings, subtitle: e.target.value})}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                placeholder="Descrição curta"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <textarea
                value={pageSettings.description}
                onChange={(e) => setPageSettings({...pageSettings, description: e.target.value})}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                placeholder="Descrição detalhada do seu trabalho"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Cor Principal</label>
              <div className="flex gap-2 mt-2">
                {["#8B5CF6", "#3B82F6", "#10B981", "#EC4899", "#F59E0B"].map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 $${
                      pageSettings.primaryColor === color ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPageSettings({...pageSettings, primaryColor: color})}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Seções Visíveis</label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estatísticas</span>
                <Switch 
                  checked={pageSettings.showStats}
                  onCheckedChange={(checked) => setPageSettings({...pageSettings, showStats: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lista de Eventos</span>
                <Switch 
                  checked={pageSettings.showEvents}
                  onCheckedChange={(checked) => setPageSettings({...pageSettings, showEvents: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Informações de Contato</span>
                <Switch 
                  checked={pageSettings.showContact}
                  onCheckedChange={(checked) => setPageSettings({...pageSettings, showContact: checked})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Links Padrão */}
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-foreground">Links de Contato</h3>
          
          <div className="space-y-3">
            {/* Instagram */}
            <div className="p-4 bg-card rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  <span className="font-medium text-foreground">Instagram</span>
                </div>
                <Switch 
                  checked={defaultLinks.instagram.visible}
                  onCheckedChange={(checked) => setDefaultLinks({
                    ...defaultLinks,
                    instagram: { ...defaultLinks.instagram, visible: checked }
                  })}
                />
              </div>
              <input
                type="text"
                value={defaultLinks.instagram.url}
                onChange={(e) => setDefaultLinks({
                  ...defaultLinks,
                  instagram: { ...defaultLinks.instagram, url: e.target.value }
                })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="@seuusuario ou https://instagram.com/seuusuario"
              />
            </div>

            {/* WhatsApp */}
            <div className="p-4 bg-card rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-foreground">WhatsApp</span>
                </div>
                <Switch 
                  checked={defaultLinks.whatsapp.visible}
                  onCheckedChange={(checked) => setDefaultLinks({
                    ...defaultLinks,
                    whatsapp: { ...defaultLinks.whatsapp, visible: checked }
                  })}
                />
              </div>
              <input
                type="text"
                value={defaultLinks.whatsapp.url}
                onChange={(e) => setDefaultLinks({
                  ...defaultLinks,
                  whatsapp: { ...defaultLinks.whatsapp, url: e.target.value }
                })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="https://wa.me/5511999999999"
              />
            </div>

            {/* Localização */}
            <div className="p-4 bg-card rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-foreground">Localização</span>
                </div>
                <Switch 
                  checked={defaultLinks.location.visible}
                  onCheckedChange={(checked) => setDefaultLinks({
                    ...defaultLinks,
                    location: { ...defaultLinks.location, visible: checked }
                  })}
                />
              </div>
              <input
                type="text"
                value={defaultLinks.location.url}
                onChange={(e) => setDefaultLinks({
                  ...defaultLinks,
                  location: { ...defaultLinks.location, url: e.target.value }
                })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="https://maps.google.com/..."
              />
            </div>

            {/* Playlist */}
            <div className="p-4 bg-card rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-purple-500" />
                  <span className="font-medium text-foreground">Playlist</span>
                </div>
                <Switch 
                  checked={defaultLinks.playlist.visible}
                  onCheckedChange={(checked) => setDefaultLinks({
                    ...defaultLinks,
                    playlist: { ...defaultLinks.playlist, visible: checked }
                  })}
                />
              </div>
              <input
                type="text"
                value={defaultLinks.playlist.url}
                onChange={(e) => setDefaultLinks({
                  ...defaultLinks,
                  playlist: { ...defaultLinks.playlist, url: e.target.value }
                })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="https://open.spotify.com/playlist/..."
              />
            </div>

            {/* Site */}
            <div className="p-4 bg-card rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-foreground">Site</span>
                </div>
                <Switch 
                  checked={defaultLinks.website.visible}
                  onCheckedChange={(checked) => setDefaultLinks({
                    ...defaultLinks,
                    website: { ...defaultLinks.website, visible: checked }
                  })}
                />
              </div>
              <input
                type="text"
                value={defaultLinks.website.url}
                onChange={(e) => setDefaultLinks({
                  ...defaultLinks,
                  website: { ...defaultLinks.website, url: e.target.value }
                })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="https://seusite.com"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions Menu */}
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-3">
            <div className="text-center p-4 bg-card rounded-lg shadow-card transition-smooth hover:shadow-elevated cursor-pointer"
                 onClick={() => setShowAddPhotos(true)}>
              <span className="text-2xl mb-2 block">📸</span>
              <p className="text-xs font-medium text-foreground">Adicionar Fotos</p>
            </div>
          </div>
        </div>

        {/* Dialog para adicionar fotos */}
        <Dialog open={showAddPhotos} onOpenChange={setShowAddPhotos}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Fotos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="photos-upload">Selecionar Fotos</Label>
                <Input
                  id="photos-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotosUpload}
                  disabled={isUploadingPhotos}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Você pode selecionar várias fotos de uma vez
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddPhotos(false)}
                  className="flex-1"
                  disabled={isUploadingPhotos}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar perfil adicional */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full mb-4">
              <User className="h-4 w-4 mr-2" />
              Editar Informações do Perfil
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="profile-bio">Bio</Label>
                <Textarea
                  id="profile-bio"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="profile-instagram">Instagram</Label>
                <Input
                  id="profile-instagram"
                  value={profileForm.instagram}
                  onChange={(e) => setProfileForm({...profileForm, instagram: e.target.value})}
                  placeholder="@seuusuario"
                />
              </div>
              <div>
                <Label htmlFor="profile-website">Website</Label>
                <Input
                  id="profile-website"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                  placeholder="https://seusite.com"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateProfile} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileContent />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <OrganizerEventsList onCreateEvent={() => setShowCreateEvent(true)} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <OrganizerSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}