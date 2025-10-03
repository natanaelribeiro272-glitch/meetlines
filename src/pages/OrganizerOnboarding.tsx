import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Upload, User, Link as LinkIcon, CheckCircle, MessageCircle, Instagram, Music, MapPin, Globe } from "lucide-react";

export default function OrganizerOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1: Username e Nome
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameError, setUsernameError] = useState("");
  
  // Step 2: Foto e Bio
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Step 3: Links
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Verificar se já completou o onboarding
    checkOnboardingStatus();
  }, [user, navigate]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    const { data: organizer } = await supabase
      .from("organizers")
      .select("id, username")
      .eq("user_id", user.id)
      .maybeSingle();

    if (organizer?.username) {
      // Já completou onboarding, redirecionar
      navigate("/");
    }
  };

  const validateUsername = async (value: string) => {
    setUsernameError("");
    
    // Validar formato
    const usernameRegex = /^[a-z0-9._]+$/;
    if (!usernameRegex.test(value)) {
      setUsernameError("Use apenas letras minúsculas, números, pontos e underscores");
      return false;
    }

    if (value.length < 3) {
      setUsernameError("Username deve ter no mínimo 3 caracteres");
      return false;
    }

    if (value.length > 30) {
      setUsernameError("Username deve ter no máximo 30 caracteres");
      return false;
    }

    // Verificar se já existe
    const { data } = await supabase
      .from("organizers")
      .select("id")
      .eq("username", value)
      .maybeSingle();

    if (data) {
      setUsernameError("Este username já está em uso");
      return false;
    }

    return true;
  };

  const handleStep1Next = async () => {
    if (!username || !displayName) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsLoading(true);
    const isValid = await validateUsername(username);
    setIsLoading(false);

    if (!isValid) return;

    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (!bio) {
      toast.error("Escreva uma bio para seu perfil");
      return;
    }
    setCurrentStep(3);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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

      setAvatarUrl(publicUrl);
      toast.success('Foto carregada!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // 1. Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          bio: bio
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // 2. Criar perfil de organizador
      const { data: organizer, error: organizerError } = await supabase
        .from("organizers")
        .insert({
          user_id: user.id,
          username: username,
          page_title: displayName,
          page_subtitle: "Organizador de Eventos",
          page_description: bio,
          avatar_url: avatarUrl,
          whatsapp_url: whatsappUrl || null,
          instagram_url: instagramUrl || null,
          playlist_url: playlistUrl || null,
          location_url: locationUrl || null,
          website_url: websiteUrl || null,
          show_whatsapp: !!whatsappUrl,
          show_instagram: !!instagramUrl,
          show_playlist: !!playlistUrl,
          show_location: !!locationUrl,
          show_website: !!websiteUrl
        })
        .select()
        .single();

      if (organizerError) throw organizerError;

      // 3. Criar estatísticas iniciais
      await supabase
        .from('organizer_stats')
        .insert({
          organizer_id: organizer.id,
          followers_count: 0,
          events_count: 0,
          average_rating: 0,
          total_ratings: 0
        });

      toast.success("Perfil criado com sucesso! 🎉");
      navigate("/");
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast.error(error.message || 'Erro ao criar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configure seu Perfil de Organizador</CardTitle>
          <CardDescription>
            Etapa {currentStep} de {totalSteps}
          </CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent>
          {/* STEP 1: Username e Nome */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <User className="h-12 w-12 mx-auto text-primary mb-2" />
                <h3 className="text-lg font-semibold">Escolha seu Username</h3>
                <p className="text-sm text-muted-foreground">
                  Seu username é único e não pode ser alterado depois
                </p>
              </div>

              <div>
                <Label htmlFor="username">Username (como @instagram)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase();
                      setUsername(value);
                      if (value.length >= 3) {
                        validateUsername(value);
                      }
                    }}
                    placeholder="seuusername"
                    className="pl-8"
                    maxLength={30}
                  />
                </div>
                {usernameError && (
                  <p className="text-sm text-destructive mt-1">{usernameError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas letras minúsculas, números, . e _
                </p>
              </div>

              <div>
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nome da sua empresa/marca"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este nome pode ser alterado depois
                </p>
              </div>

              <Button 
                onClick={handleStep1Next} 
                className="w-full"
                disabled={isLoading || !username || !displayName || !!usernameError}
              >
                {isLoading ? "Verificando..." : "Próxima Etapa"}
              </Button>
            </div>
          )}

          {/* STEP 2: Foto e Bio */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Upload className="h-12 w-12 mx-auto text-primary mb-2" />
                <h3 className="text-lg font-semibold">Foto e Biografia</h3>
                <p className="text-sm text-muted-foreground">
                  Ajude as pessoas a conhecerem você
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} />
                  ) : (
                    <AvatarFallback className="bg-surface text-2xl">
                      {displayName.charAt(0) || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload-onboarding"
                />
                <label htmlFor="avatar-upload-onboarding" className="w-full">
                  <Button 
                    variant="outline" 
                    className="w-full cursor-pointer"
                    disabled={isUploadingAvatar}
                    type="button"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {avatarUrl ? "Trocar Foto" : "Adicionar Foto"}
                      </>
                    )}
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground text-center">
                  Foto de perfil (opcional)
                </p>
              </div>

              <div>
                <Label htmlFor="bio">Biografia *</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre você e seus eventos..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {bio.length}/500 caracteres
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                  className="w-full"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleStep2Next} 
                  className="w-full"
                  disabled={!bio}
                >
                  Próxima Etapa
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Links Sociais */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <LinkIcon className="h-12 w-12 mx-auto text-primary mb-2" />
                <h3 className="text-lg font-semibold">Links e Redes Sociais</h3>
                <p className="text-sm text-muted-foreground">
                  Conecte suas redes (todos opcionais)
                </p>
              </div>

              <div>
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  value={whatsappUrl}
                  onChange={(e) => setWhatsappUrl(e.target.value)}
                  placeholder="https://wa.me/5511999999999"
                />
              </div>

              <div>
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/seu_perfil"
                />
              </div>

              <div>
                <Label htmlFor="playlist" className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-purple-500" />
                  Playlist
                </Label>
                <Input
                  id="playlist"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                />
              </div>

              <div>
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  Localização
                </Label>
                <Input
                  id="location"
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div>
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Site
                </Label>
                <Input
                  id="website"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://seusite.com.br"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(2)}
                  className="w-full"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleComplete} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Criando Perfil...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Concluir
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
