import { useState, useEffect } from "react";
import { Edit3, Share2, MapPin, Calendar, Eye, MoreHorizontal, User, Settings, Palette, Home, List, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizer } from "@/hooks/useOrganizer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OrganizerEventsList from "@/components/OrganizerEventsList";
import OrganizerCustomization from "@/components/OrganizerCustomization";
import OrganizerSettings from "@/components/OrganizerSettings";
import CreateEvent from "@/pages/CreateEvent";
import event1 from "@/assets/event-1.jpg";

export default function OrganizerPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [linkForm, setLinkForm] = useState({ title: "", url: "", color: "#8b5cf6" });
  const { user } = useAuth();
  const { organizerData, events, customLinks, loading, updateOrganizerProfile, addCustomLink } = useOrganizer();

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

  // Get the most recent event
  const currentEvent = events.length > 0 ? events[0] : null;

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

  const handleCreateLink = async () => {
    if (!linkForm.title || !linkForm.url) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    await addCustomLink({
      title: linkForm.title,
      url: linkForm.url,
      color: linkForm.color,
      is_active: true
    });

    setLinkForm({ title: "", url: "", color: "#8b5cf6" });
    setShowCreateLink(false);
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/${organizerData?.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência!');
  };

  if (showCreateEvent) {
    return <CreateEvent onBack={() => setShowCreateEvent(false)} />;
  }

  // Profile tab content
  const ProfileContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <header className="relative h-64 bg-gradient-to-b from-surface to-background rounded-lg overflow-hidden">
        {organizerData?.cover_image_url || currentEvent ? (
          <img
            src={organizerData?.cover_image_url || currentEvent?.image_url || event1}
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
          
          <Button variant="outline" size="sm" onClick={() => setActiveTab("customization")}>
            <Edit3 className="h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Stats */}
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

        {/* Current Event */}
        {currentEvent ? (
          <div className="mb-6 p-4 bg-card rounded-lg shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">Evento Atual</h2>
              {currentEvent.is_live && (
                <div className="flex items-center gap-1 text-destructive">
                  <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                  <span className="text-xs font-medium">AO VIVO</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mb-3">
              {currentEvent.image_url && (
                <img
                  src={currentEvent.image_url}
                  alt={currentEvent.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground line-clamp-1">{currentEvent.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(currentEvent.event_date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{currentEvent.location}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{currentEvent.current_attendees}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-card rounded-lg shadow-card text-center">
            <p className="text-muted-foreground mb-3">Nenhum evento criado ainda</p>
            <Button onClick={() => setShowCreateEvent(true)} size="sm">
              Criar Primeiro Evento
            </Button>
          </div>
        )}

        {/* Event Status */}
        <div className="mb-6 p-4 bg-card rounded-lg">
          <h3 className="font-semibold text-foreground mb-4">Status do Evento</h3>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">Evento Ativo</p>
              <p className="text-sm text-muted-foreground">Evento está sendo exibido publicamente</p>
            </div>
            <Switch checked={true} />
          </div>
        </div>

        {/* Quick Actions Menu */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 bg-card rounded-lg shadow-card transition-smooth hover:shadow-elevated cursor-pointer">
              <span className="text-2xl mb-2 block">🔗</span>
              <p className="text-xs font-medium text-foreground">Links</p>
            </div>
            <div className="text-center p-4 bg-card rounded-lg shadow-card transition-smooth hover:shadow-elevated cursor-pointer">
              <span className="text-2xl mb-2 block">📸</span>
              <p className="text-xs font-medium text-foreground">Fotos</p>
            </div>
          </div>
        </div>

        {/* Custom Link Buttons */}
        <div className="space-y-3 mb-8">
          <h3 className="font-semibold text-foreground">Seus Links</h3>
          
          {customLinks.filter(link => link.is_active).map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-card transition-smooth hover:shadow-elevated cursor-pointer"
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: link.color }}
              >
                {link.icon || link.title.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{link.title}</p>
              </div>
            </a>
          ))}
          
          <Dialog open={showCreateLink} onOpenChange={setShowCreateLink}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Link</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="link-title">Título</Label>
                  <Input
                    id="link-title"
                    value={linkForm.title}
                    onChange={(e) => setLinkForm({...linkForm, title: e.target.value})}
                    placeholder="Ex: Instagram, WhatsApp..."
                  />
                </div>
                <div>
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({...linkForm, url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="link-color">Cor</Label>
                  <Input
                    id="link-color"
                    type="color"
                    value={linkForm.color}
                    onChange={(e) => setLinkForm({...linkForm, color: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateLink} className="flex-1">
                    Criar Link
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateLink(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Share Link */}
        <div className="mb-8 p-4 bg-surface rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Compartilhar Página</h3>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-card rounded-md">
              <p className="text-sm font-mono text-muted-foreground">
                {window.location.origin}/{organizerData?.slug || 'seu-perfil'}
              </p>
            </div>
            <Button variant="glow" onClick={handleShareLink}>
              <Share2 className="h-4 w-4" />
              Copiar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex bg-surface rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home className="h-4 w-4" />
              Perfil
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "events"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
              Eventos
            </button>
            <button
              onClick={() => setActiveTab("customization")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "customization"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Palette className="h-4 w-4" />
              Design
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === "settings"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="h-4 w-4" />
              Config
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && <ProfileContent />}
        {activeTab === "events" && <OrganizerEventsList onCreateEvent={() => setShowCreateEvent(true)} />}
        {activeTab === "customization" && <OrganizerCustomization />}
        {activeTab === "settings" && <OrganizerSettings />}
      </div>
    </div>
  );
}