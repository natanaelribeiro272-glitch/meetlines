import { useState } from "react";
import { 
  User, 
  Lock, 
  Heart, 
  Users, 
  Briefcase, 
  Calendar,
  Edit,
  Settings,
  Eye,
  Camera,
  EyeOff,
  ExternalLink,
  Instagram,
  MessageCircle,
  Music,
  Link,
  Plus,
  LogOut,
  Trash2
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

interface UserProfileProps {
  userType: "user" | "organizer";
}

const interestOptions = [
  { id: "namoro", label: "💕 Namoro", icon: Heart },
  { id: "amizade", label: "👥 Amizade", icon: Users },
  { id: "curtir", label: "🎉 Curtir", icon: Calendar },
  { id: "network", label: "🤝 Network", icon: Briefcase },
];

const socialPlatforms = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-500", placeholder: "https://wa.me/11999999999" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500", placeholder: "https://instagram.com/seuperfil" },
  { id: "tiktok", label: "TikTok", icon: Music, color: "text-black", placeholder: "https://tiktok.com/@seuperfil" },
  { id: "linktree", label: "Linktree", icon: Link, color: "text-blue-500", placeholder: "https://linktr.ee/seuperfil" },
];

export default function UserProfile({ userType }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState(["amizade", "curtir"]);
  const [showAddSocialDialog, setShowAddSocialDialog] = useState(false);
  const [socialLinks, setSocialLinks] = useState([
    { id: "1", platform: "instagram", url: "https://instagram.com/joaosilva", isVisible: true },
    { id: "2", platform: "whatsapp", url: "https://wa.me/11999999999", isVisible: false },
  ]);
  const [profileData, setProfileData] = useState({
    name: "João Silva",
    bio: "Adoro música eletrônica e encontrar pessoas novas em eventos!",
    location: "Parauapebas, PA",
    age: "25",
  });

  const [notes, setNotes] = useState("Sempre nos eventos de house music. Venha conversar se me vir! 🎵");

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const toggleSocialVisibility = (socialId: string) => {
    setSocialLinks(prev => 
      prev.map(link => 
        link.id === socialId 
          ? { ...link, isVisible: !link.isVisible }
          : link
      )
    );
  };

  const addSocialLink = (platform: string, url: string) => {
    const newLink = {
      id: Date.now().toString(),
      platform,
      url,
      isVisible: true
    };
    setSocialLinks(prev => [...prev, newLink]);
    setShowAddSocialDialog(false);
  };

  const removeSocialLink = (socialId: string) => {
    setSocialLinks(prev => prev.filter(link => link.id !== socialId));
  };

  const participatedEvents = [
    { id: "1", name: "Festival Eletrônico Underground", date: "15 Out 2024", status: "Participei" },
    { id: "2", name: "Sunset Rooftop Party", date: "08 Out 2024", status: "Confirmado" },
    { id: "3", name: "Tech House Night", date: "28 Set 2024", status: "Participei" },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <Button
                size="icon"
                variant="outline"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isEditing ? (
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-xl font-semibold"
                  />
                ) : (
                  <h2 className="text-xl font-semibold">{profileData.name}</h2>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="mb-2">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Localização"
                      className="text-sm"
                    />
                    <Input
                      value={profileData.age}
                      onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Idade"
                      className="text-sm w-20"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{profileData.location} • {profileData.age} anos</p>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Escreva sobre você..."
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setIsEditing(false)}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{profileData.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Meus Interesses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {interestOptions.map((interest) => (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedInterests.includes(interest.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <interest.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{interest.label}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Redes Sociais
            </CardTitle>
            <Dialog open={showAddSocialDialog} onOpenChange={setShowAddSocialDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Rede Social</DialogTitle>
                </DialogHeader>
                <AddSocialForm onAdd={addSocialLink} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {socialLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma rede social adicionada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {socialLinks.map((social) => {
                const platform = socialPlatforms.find(p => p.id === social.platform);
                if (!platform) return null;
                
                const Icon = platform.icon;
                return (
                  <div key={social.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Icon className={`h-5 w-5 ${platform.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{platform.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{social.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {social.isVisible ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Switch
                          checked={social.isVisible}
                          onCheckedChange={() => toggleSocialVisibility(social.id)}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSocialLink(social.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Public Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Notas Públicas
            <Badge variant="secondary" className="text-xs">Visível para outros</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escreva algo sobre você que outros possam ver..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>
    </div>
  );

  const AddSocialForm = ({ onAdd }: { onAdd: (platform: string, url: string) => void }) => {
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const [url, setUrl] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedPlatform && url) {
        onAdd(selectedPlatform, url);
        setSelectedPlatform("");
        setUrl("");
      }
    };

    const currentPlatform = socialPlatforms.find(p => p.id === selectedPlatform);

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Rede Social</Label>
          <div className="grid grid-cols-2 gap-2">
            {socialPlatforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`p-3 border rounded-lg flex items-center gap-2 transition-all ${
                    selectedPlatform === platform.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${platform.color}`} />
                  <span className="text-sm">{platform.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {selectedPlatform && (
          <div className="space-y-2">
            <Label>URL/Link</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={currentPlatform?.placeholder}
              type="url"
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={!selectedPlatform || !url}>
          Adicionar Link
        </Button>
      </form>
    );
  };

  const renderEventsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Meus Eventos</h3>
        <Badge variant="outline">{participatedEvents.length} eventos</Badge>
      </div>
      
      {participatedEvents.map((event) => (
        <Card key={event.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{event.name}</h4>
                <p className="text-sm text-muted-foreground">{event.date}</p>
              </div>
              <Badge 
                variant={event.status === "Participei" ? "default" : "secondary"}
              >
                {event.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={profileData.name} />
          </div>
          
          <div className="space-y-2">
            <Label>Localização</Label>
            <Input value={profileData.location} />
          </div>
          
          <div className="space-y-2">
            <Label>Idade</Label>
            <Input value={profileData.age} />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label>Nova Senha</Label>
            <Input type="password" placeholder="Digite sua nova senha" />
          </div>
          
          <div className="space-y-2">
            <Label>Confirmar Senha</Label>
            <Input type="password" placeholder="Confirme sua nova senha" />
          </div>
          
          <Button className="w-full">
            <Lock className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Perfil Público</p>
              <p className="text-sm text-muted-foreground">Outros podem ver seu perfil nos eventos</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mostrar Interesses</p>
              <p className="text-sm text-muted-foreground">Exibir seus interesses para outros usuários</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent className="p-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                <LogOut className="h-4 w-4 mr-2" />
                Sair da Conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => console.log("Logout realizado")}>
                  Sair
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-foreground">Excluir Conta</p>
              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Conta Permanentemente</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Todos os seus dados e participações em eventos serão permanentemente excluídos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => console.log("Conta excluída")} className="bg-destructive hover:bg-destructive/90">
                    Excluir Definitivamente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Meu Perfil" userType={userType} />
      
      <div className="px-4 py-4 max-w-md mx-auto">
        {/* Info sobre as abas */}
        <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground text-center">
            {activeTab === "profile" && "Configure seu perfil, redes sociais e interesses"}
            {activeTab === "events" && "Veja seus eventos participados e confirmados"}
            {activeTab === "settings" && "Configurações de conta e privacidade"}
          </p>
        </div>
        {/* Tab Navigation */}
        <div className="flex bg-surface rounded-lg p-1 mb-6 border border-border">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-smooth ${
              activeTab === "profile"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-1 justify-center">
              <User className="h-4 w-4" />
              <span>Perfil</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-smooth ${
              activeTab === "events"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-1 justify-center">
              <Calendar className="h-4 w-4" />
              <span>Eventos</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-smooth ${
              activeTab === "settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-1 justify-center">
              <Settings className="h-4 w-4" />
              <span>Config</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "events" && renderEventsTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </div>
    </div>
  );
}