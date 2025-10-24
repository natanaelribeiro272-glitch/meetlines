import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Heart, Users, Briefcase, Calendar, Edit, Settings, Eye, Camera, EyeOff, ExternalLink, Instagram, MessageCircle, Music, Link, Plus, LogOut, Trash2, MapPin, Facebook, Twitter, Linkedin, Youtube, Ticket } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, calculateAge } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
interface UserProfileProps {
  userType: "user" | "organizer";
}
const socialPlatforms = [{
  id: "instagram",
  label: "Instagram",
  icon: Instagram,
  color: "text-pink-500",
  placeholder: "https://instagram.com/seuperfil",
  field: "instagram_url" as const
}, {
  id: "whatsapp",
  label: "WhatsApp",
  icon: MessageCircle,
  color: "text-green-500",
  placeholder: "https://wa.me/5511999999999",
  field: "phone" as const
}];
export default function UserProfile({
  userType
}: UserProfileProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [notesEdited, setNotesEdited] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    location: "",
    age: "",
    notes: "",
    notes_visible: true,
    phone: "",
    website: "",
    instagram_url: "",
    twitter_url: "",
    linkedin_url: "",
    facebook_url: "",
    tiktok_url: "",
    youtube_url: "",
    interest: "curtição" as "namoro" | "network" | "curtição" | "amizade" | "casual",
    relationship_status: "preferencia_nao_informar" as "solteiro" | "namorando" | "casado" | "relacionamento_aberto" | "preferencia_nao_informar"
  });
  const {
    user,
    signOut
  } = useAuth();
  const {
    profile,
    loading,
    saving,
    updateProfile,
    uploadAvatar
  } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleDeleteAccount = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado para deletar sua conta');
        return;
      }
      const {
        error
      } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) {
        console.error('Error deleting account:', error);
        toast.error('Erro ao deletar conta. Tente novamente.');
        return;
      }
      toast.success('Conta deletada com sucesso!');

      // Sign out and redirect to auth page
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao deletar conta. Tente novamente.');
    }
  };

  // Calculate age from birth_date
  const userAge = profile?.birth_date ? calculateAge(profile.birth_date) : null;

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        age: userAge?.toString() || "",
        notes: profile.notes || "",
        notes_visible: profile.notes_visible ?? true,
        phone: profile.phone || "",
        website: profile.website || "",
        instagram_url: profile.instagram_url || "",
        twitter_url: profile.twitter_url || "",
        linkedin_url: profile.linkedin_url || "",
        facebook_url: profile.facebook_url || "",
        tiktok_url: profile.tiktok_url || "",
        youtube_url: profile.youtube_url || "",
        interest: profile.interest as any || "curtição",
        relationship_status: (profile.relationship_status as any) || "preferencia_nao_informar"
      });
      setNotesEdited(false);
    }
  }, [profile, userAge]);
  const handleSaveField = async (field: keyof typeof formData) => {
    const value = formData[field];
    const updateData: any = {
      [field]: value || null
    };

    // Special handling for age field
    if (field === 'age') {
      updateData.age = value ? parseInt(value as string) : null;
    }
    const success = await updateProfile(updateData);
    if (success) {
      setEditingField(null);
    }
    return success;
  };
  const handleSaveSocialLink = async (platform: string, url: string) => {
    const socialPlatform = socialPlatforms.find(p => p.id === platform);
    if (!socialPlatform) return;
    await updateProfile({
      [socialPlatform.field]: url || null
    });
  };

  const handleSaveAll = async () => {
    const updateData: any = {
      display_name: formData.display_name || null,
      bio: formData.bio || null,
      location: formData.location || null,
      instagram_url: formData.instagram_url || null,
      phone: formData.phone || null,
      twitter_url: formData.twitter_url || null,
      linkedin_url: formData.linkedin_url || null,
      facebook_url: formData.facebook_url || null,
      tiktok_url: formData.tiktok_url || null,
      youtube_url: formData.youtube_url || null,
      website: formData.website || null,
    };

    const success = await updateProfile(updateData);
    if (success) {
      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
    }
  };
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    await uploadAvatar(file);
  };
  if (loading) {
    return <div className="min-h-screen bg-background">
        <Header title="Meu Perfil" />
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      </div>;
  }
  const renderProfileTab = () => <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden ring-4 ring-background shadow-lg">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <User className="h-10 w-10 text-primary" />}
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>

            <h2 className="text-2xl font-bold mb-1">{profile?.display_name || 'Seu Nome'}</h2>
            <p className="text-sm text-muted-foreground mb-2">@{profile?.username || 'username'}</p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{profile?.location || 'Localização'}</span>
              </div>
              <span>•</span>
              <span>{userAge ? `${userAge} anos` : 'Idade não informada'}</span>
            </div>

            {profile?.bio && (
              <p className="text-sm text-muted-foreground max-w-md mb-4">{profile.bio}</p>
            )}

            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              size="sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Redes Sociais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {socialPlatforms.map(platform => {
            const Icon = platform.icon;
            const currentUrl = profile?.[platform.field] || "";
            return <div key={platform.id} className="flex items-start gap-3 p-4 border rounded-lg bg-card">
                  <Icon className={`h-5 w-5 ${platform.color} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1">{platform.label}</p>
                    <p className="text-sm text-muted-foreground break-all">
                      {currentUrl || 'Não configurado'}
                    </p>
                  </div>
                  {currentUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => window.open(currentUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>;
          })}
          </div>
        </CardContent>
      </Card>

      {/* Status de Relacionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Status de Relacionamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "solteiro", label: "Solteiro(a)", emoji: "😊" },
              { value: "namorando", label: "Namorando", emoji: "💑" },
              { value: "casado", label: "Casado(a)", emoji: "💍" },
              { value: "relacionamento_aberto", label: "Relacionamento Aberto", emoji: "🌈" },
              { value: "preferencia_nao_informar", label: "Não informar", emoji: "🤐" }
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const newStatus = opt.value as "solteiro" | "namorando" | "casado" | "relacionamento_aberto" | "preferencia_nao_informar";
                  setFormData((prev) => ({ ...prev, relationship_status: newStatus }));
                  updateProfile({ relationship_status: newStatus });
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  formData.relationship_status === opt.value
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <span className="mr-1">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>;
  const renderSettingsTab = () => <div className="space-y-6">
      {/* Push Notifications Settings */}
      <PushNotificationSettings />

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          
          <div className="space-y-2">
            <Label>Telefone</Label>
            {editingField === 'phone' ? <div className="flex gap-2">
                <Input value={formData.phone} onChange={e => setFormData(prev => ({
              ...prev,
              phone: e.target.value
            }))} placeholder="(11) 99999-9999" />
                <Button size="sm" onClick={() => handleSaveField('phone')} disabled={saving}>
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                  Cancelar
                </Button>
              </div> : <div className="flex gap-2">
                <Input value={profile?.phone || 'Não informado'} disabled />
                <Button size="sm" variant="outline" onClick={() => setEditingField('phone')}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>}
          </div>
          
          <div className="space-y-2">
            <Label>Website</Label>
            {editingField === 'website' ? <div className="flex gap-2">
                <Input value={formData.website} onChange={e => setFormData(prev => ({
              ...prev,
              website: e.target.value
            }))} placeholder="https://seusite.com" />
                <Button size="sm" onClick={() => handleSaveField('website')} disabled={saving}>
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                  Cancelar
                </Button>
              </div> : <div className="flex gap-2">
                <Input value={profile?.website || 'Não informado'} disabled />
                <Button size="sm" variant="outline" onClick={() => setEditingField('website')}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>}
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
              
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={signOut}>
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
              <p className="text-sm text-muted-foreground mb-4">
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
                    Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
                    Você poderá criar uma nova conta a qualquer momento com o mesmo email.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                    Excluir Definitivamente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>;
  return <div className="min-h-screen bg-background">
      <Header title="Meu Perfil" />
      
      <div className="p-4 pb-24">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
          <button onClick={() => setActiveTab("profile")} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === "profile" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <User className="h-4 w-4 inline mr-2" />
            Perfil
          </button>
          <button onClick={() => navigate("/my-events")} className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-all">
            <Ticket className="h-4 w-4 inline mr-2" />
            Meus Eventos
          </button>
          <button onClick={() => setActiveTab("settings")} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === "settings" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Settings className="h-4 w-4 inline mr-2" />
            Configurações
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-display-name">Nome</Label>
              <Input
                id="edit-display-name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={profile?.username || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Username não pode ser alterado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Localização</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Cidade, Estado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bio">Biografia</Label>
              <Textarea
                id="edit-bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Conte um pouco sobre você..."
                rows={4}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Redes Sociais</h3>
              {socialPlatforms.map(platform => {
                const Icon = platform.icon;
                const fieldValue = formData[platform.field as keyof typeof formData] || '';
                return (
                  <div key={platform.id} className="space-y-2">
                    <Label htmlFor={`edit-${platform.field}`} className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${platform.color}`} />
                      {platform.label}
                    </Label>
                    <Input
                      id={`edit-${platform.field}`}
                      value={fieldValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, [platform.field]: e.target.value }))}
                      placeholder={platform.placeholder}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAll} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>;
}