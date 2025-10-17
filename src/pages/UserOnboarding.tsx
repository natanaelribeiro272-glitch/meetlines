import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, User, Instagram, MessageCircle, Sparkles, Upload, Check, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES } from '@/constants/categories';

interface NavState {
  email?: string;
  password?: string;
  name?: string;
}

const AVAILABLE_INTERESTS = CATEGORIES.map(c => ({
  id: c.value,
  label: c.label.replace(/^.+\s/, ''), // Remove emoji
  icon: c.label.match(/^(.+?)\s/)?.[1] || '✨'
}));

interface SuggestedOrganizer {
  id: string;
  page_title: string;
  avatar_url?: string;
  category?: string;
  followers_count: number;
  events_count: number;
}

export default function UserOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as NavState;

  // Form data
  const [email, setEmail] = useState(state?.email || '');
  const [password, setPassword] = useState(state?.password || '');
  const [name, setName] = useState(state?.name || '');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [suggestedOrganizers, setSuggestedOrganizers] = useState<SuggestedOrganizer[]>([]);
  const [followedOrganizers, setFollowedOrganizers] = useState<string[]>([]);

  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const steps = ['Dados Básicos', 'Foto de Perfil', 'Redes Sociais', 'Interesses', 'Sugestões'];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsExistingUser(true);
        setCurrentUserId(session.user.id);
        setEmail(session.user.email || '');

        // Get user data from metadata
        const displayName = session.user.user_metadata?.display_name;
        if (displayName) setName(displayName);

        // Start from step 1 (username) if already logged in
        setCurrentStep(1);
      }
    };
    checkExistingSession();
  }, []);

  // Handle logout/reset
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.info('Sessão encerrada. Você pode criar uma nova conta.');
      setIsExistingUser(false);
      setCurrentUserId(null);
      setCurrentStep(0);
      setEmail('');
      setPassword('');
      setName('');
      setUsername('');
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erro ao sair. Tente novamente.');
    }
  };

  // Validate username
  const validateUsername = async (value: string): Promise<boolean> => {
    if (!value) {
      setUsernameError('Username é obrigatório');
      return false;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(value)) {
      setUsernameError('Use apenas letras minúsculas, números e _ (3-20 caracteres)');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', value)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking username:', error);
        setUsernameError('Erro ao verificar username');
        return false;
      }

      if (data) {
        setUsernameError('Username já está em uso');
        return false;
      }

      setUsernameError('');
      return true;
    } catch (error) {
      console.error('Error:', error);
      setUsernameError('Erro ao verificar username');
      return false;
    }
  };

  // Handle avatar selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle interest selection
  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  // Step handlers
  const handleStep0Next = () => {
    if (!email || !password || !name) {
      toast.error('Preencha todos os campos');
      return;
    }
    setCurrentStep(1);
  };

  const handleStep1Next = async () => {
    const isValid = await validateUsername(username);
    if (!isValid) return;
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    setCurrentStep(3);
  };

  const handleStep3Next = async () => {
    if (selectedInterests.length === 0) {
      toast.error('Selecione pelo menos um interesse');
      return;
    }
    setCurrentStep(4);
  };

  // Buscar organizadores baseados nos interesses selecionados
  useEffect(() => {
    if (currentStep === 4 && selectedInterests.length > 0) {
      fetchSuggestedOrganizers();
    }
  }, [currentStep, selectedInterests]);

  const fetchSuggestedOrganizers = async () => {
    try {
      setLoading(true);
      
      const { data: organizersData, error } = await supabase
        .from('organizers')
        .select(`
          id,
          page_title,
          avatar_url,
          category,
          user_id
        `)
        .eq('is_page_active', true)
        .limit(10);

      if (error) throw error;

      // Buscar stats para cada organizador
      const processedOrganizers = await Promise.all(
        (organizersData || []).map(async (org) => {
          const [followersRes, eventsRes] = await Promise.all([
            supabase
              .from('followers')
              .select('id', { count: 'exact', head: true })
              .eq('organizer_id', org.id),
            supabase
              .from('events')
              .select('id', { count: 'exact', head: true })
              .eq('organizer_id', org.id)
          ]);

          return {
            ...org,
            followers_count: followersRes.count ?? 0,
            events_count: eventsRes.count ?? 0
          };
        })
      );

      // Ordenar por relevância (mais eventos e seguidores)
      processedOrganizers.sort((a, b) => 
        (b.followers_count + b.events_count) - (a.followers_count + a.events_count)
      );

      setSuggestedOrganizers(processedOrganizers.slice(0, 6));
    } catch (error) {
      console.error('Error fetching suggested organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollowOrganizer = (organizerId: string) => {
    setFollowedOrganizers(prev => 
      prev.includes(organizerId)
        ? prev.filter(id => id !== organizerId)
        : [...prev, organizerId]
    );
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      let userId: string;

      // If user is already logged in, use existing session
      if (isExistingUser && currentUserId) {
        userId = currentUserId;
      } else {
        // 1. Try to sign up the user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: name,
              role: 'user'
            }
          }
        });

        // Handle "user already exists" error - try to login instead
        if (signUpError) {
          if (signUpError.message?.includes('already registered') || signUpError.message?.includes('User already registered')) {
            // Try to sign in with the provided credentials
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });

            if (signInError) {
              toast.error('Email já cadastrado. Verifique sua senha e tente novamente.');
              setCurrentStep(0); // Go back to login step
              return;
            }

            if (!signInData.user) {
              throw new Error('Falha ao fazer login');
            }

            userId = signInData.user.id;
            toast.info('Login realizado! Complete seu perfil.');
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw signUpError;
          }
        } else {
          if (!authData.user) throw new Error('Falha ao criar usuário');

          // 2. Try to sign in (in case email confirmation is disabled)
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          // If sign in fails, it's likely due to email confirmation
          if (signInError) {
            toast.success('Conta criada! Verifique seu email para confirmar.');
            navigate('/auth');
            return;
          }

          userId = authData.user.id;
          // Wait a bit for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // 3. Upload avatar if provided
      let avatarUrl = '';
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      // 4. Update profile with all collected information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: name,
          username: username,
          avatar_url: avatarUrl || null,
          instagram_url: instagramUrl || null,
          phone: whatsappUrl || null,
          interests: selectedInterests,
          notes: `Interesses: ${selectedInterests.join(', ')}`,
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
      }

      // 5. Seguir organizadores selecionados
      if (followedOrganizers.length > 0) {
        const followPromises = followedOrganizers.map(organizerId =>
          supabase
            .from('followers')
            .insert({
              user_id: userId,
              organizer_id: organizerId
            })
        );
        await Promise.all(followPromises);
      }

      toast.success('Perfil criado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      
      // Mostrar erro específico sem limpar os dados do formulário
      if (error.message?.includes('Username cannot be changed')) {
        toast.error('Erro: Username já foi definido. Tente fazer login.');
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao criar perfil. Tente novamente.');
      }
      
      // NÃO limpar os dados do formulário para permitir correção
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Complete seu Perfil</h1>
            <p className="text-muted-foreground text-sm">{steps[currentStep]}</p>
            {!isExistingUser && currentStep === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Já tem conta?{' '}
                <button
                  onClick={() => navigate('/auth')}
                  className="text-primary hover:underline font-medium"
                >
                  Fazer login
                </button>
              </p>
            )}
            {isExistingUser && (
              <p className="text-xs text-muted-foreground mt-2">
                Conectado como {email}.{' '}
                <button
                  onClick={handleLogout}
                  className="text-destructive hover:underline font-medium"
                >
                  Sair
                </button>
              </p>
            )}
          </div>

          {/* Progress */}
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Passo {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Step 0: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              {!isExistingUser && (
                <>
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <Button onClick={handleStep0Next} className="w-full">
                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step 1: Username & Avatar */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username (ID único)</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase());
                    setUsernameError('');
                  }}
                  onBlur={(e) => validateUsername(e.target.value)}
                  placeholder="seu_username"
                  className={usernameError ? 'border-destructive' : ''}
                />
                {usernameError && (
                  <p className="text-sm text-destructive mt-1">{usernameError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Use letras minúsculas, números e _
                </p>
              </div>

              <div>
                <Label>Foto de Perfil</Label>
                <div className="flex flex-col items-center gap-4 mt-2">
                  <Avatar className="h-24 w-24">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} />
                    ) : (
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label htmlFor="avatar-upload">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        {avatarPreview ? 'Trocar Foto' : 'Escolher Foto'}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(0)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handleStep1Next} className="flex-1">
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Social Media */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="instagram">Instagram (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="instagram"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/seu_username"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    value={whatsappUrl}
                    onChange={(e) => setWhatsappUrl(e.target.value)}
                    placeholder="https://wa.me/5511999999999"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handleStep2Next} className="flex-1">
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4" />
                  Selecione seus interesses
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_INTERESTS.map((interest) => (
                    <Badge
                      key={interest.id}
                      variant={selectedInterests.includes(interest.id) ? "default" : "outline"}
                      className="justify-center cursor-pointer py-3 text-sm transition-all hover:scale-105"
                      onClick={() => toggleInterest(interest.id)}
                    >
                      <span className="mr-2">{interest.icon}</span>
                      {interest.label}
                      {selectedInterests.includes(interest.id) && (
                        <Check className="ml-2 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Selecione pelo menos um interesse
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button 
                  onClick={handleStep3Next} 
                  disabled={selectedInterests.length === 0}
                  className="flex-1"
                >
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Suggested Organizers */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4" />
                  Siga organizadores que te interessam
                </Label>
                <p className="text-xs text-muted-foreground mb-4">
                  Personalize sua experiência seguindo organizadores
                </p>
                
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando sugestões...
                  </div>
                ) : suggestedOrganizers.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {suggestedOrganizers.map((org) => (
                      <div
                        key={org.id}
                        onClick={() => toggleFollowOrganizer(org.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 ${
                          followedOrganizers.includes(org.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border'
                        }`}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={org.avatar_url} />
                          <AvatarFallback>{org.page_title[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{org.page_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {org.followers_count} seguidores • {org.events_count} eventos
                          </p>
                        </div>
                        {followedOrganizers.includes(org.id) && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum organizador encontrado
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(3)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Criando...' : 'Concluir'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
