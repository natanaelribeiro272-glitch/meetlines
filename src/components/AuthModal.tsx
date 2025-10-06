import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Upload } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionDescription?: string;
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, actionDescription, onSuccess }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup wizard state (pre-account)
  const [signupRole, setSignupRole] = useState<"user" | "organizer">("user");
  const [signupStep, setSignupStep] = useState(0);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [bio, setBio] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const AVAILABLE_INTERESTS = [
    { id: 'balada', label: 'Balada' },
    { id: 'lives', label: 'Lives' },
    { id: 'encontros', label: 'Encontros' },
    { id: 'shows', label: 'Shows' },
    { id: 'festas', label: 'Festas' },
    { id: 'networking', label: 'Networking' },
  ];
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Move through steps until the last one
    if (signupStep < 3) {
      setSignupStep((s) => s + 1);
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;

      // 1) Create auth user only at the end
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: signupName,
            role: signupRole,
          },
        },
      });
      if (error) throw error;

      // 2) Ensure session
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: signupEmail,
          password: signupPassword,
        });
        if (signInError) throw signInError;
      }

      // 3) Upload avatar if any
      let avatarUrl: string | null = null;
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (currentUser && avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const path = `${currentUser.id}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(path, avatarFile, { upsert: true });
        if (!uploadError) {
          const { data: pub } = supabase.storage.from('user-uploads').getPublicUrl(path);
          avatarUrl = pub.publicUrl;
        }
      }

      // 4) Update profile with collected data
      if (currentUser) {
        await supabase
          .from('profiles')
          .update({
            display_name: signupName,
            username: signupUsername || null,
            avatar_url: avatarUrl,
            bio: bio || null,
            instagram_url: instagramUrl || null,
            phone: whatsappUrl || null,
            notes: selectedInterests.length ? `Interesses: ${selectedInterests.join(', ')}` : null,
          })
          .eq('user_id', currentUser.id);
      }

      toast.success('Conta criada com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bem-vindo!</DialogTitle>
          <DialogDescription>
            {actionDescription || "Faça login ou crie uma conta para continuar"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              {signupStep === 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de conta</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={signupRole === 'user' ? 'default' : 'outline'} className="flex-1" onClick={() => setSignupRole('user')}>Participante</Button>
                      <Button type="button" variant={signupRole === 'organizer' ? 'default' : 'outline'} className="flex-1" onClick={() => setSignupRole('organizer')}>Organizador</Button>
                    </div>
                  </div>
                </>
              )}

              {signupStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="seu_username"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value.toLowerCase())}
                    />
                    <p className="text-xs text-muted-foreground">Use letras minúsculas, números e _</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Foto de perfil (opcional)</Label>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-16 w-16">
                        {avatarPreview ? <AvatarImage src={avatarPreview} /> : <AvatarFallback>U</AvatarFallback>}
                      </Avatar>
                      <div>
                        <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        <Label htmlFor="avatar-input">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span className="cursor-pointer"><Upload className="h-4 w-4 mr-2"/>Selecionar foto</span>
                          </Button>
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {signupStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="signup-bio">Bio (opcional)</Label>
                    <Textarea id="signup-bio" placeholder="Fale um pouco sobre você" value={bio} onChange={(e) => setBio(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-insta">Instagram (opcional)</Label>
                    <Input id="signup-insta" placeholder="https://instagram.com/usuario" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-whats">WhatsApp (opcional)</Label>
                    <Input id="signup-whats" placeholder="https://wa.me/5511999999999" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Interesses (opcional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_INTERESTS.map((it) => (
                        <Badge key={it.id} variant={selectedInterests.includes(it.id) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleInterest(it.id)}>
                          {it.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {signupStep === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                {signupStep > 0 && (
                  <Button type="button" variant="outline" onClick={() => setSignupStep((s) => s - 1)}>
                    Voltar
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Carregando...' : signupStep < 3 ? 'Próximo' : 'Finalizar Cadastro'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
