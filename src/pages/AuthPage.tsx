import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
interface AuthPageProps {
  onLogin: (userType: "user" | "organizer") => void;
}
export default function AuthPage({
  onLogin
}: AuthPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"user" | "organizer">("user");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const {
    signUp,
    signIn,
    user
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo);
    }
  }, [user, navigate, searchParams]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const {
          error
        } = await signIn(formData.email, formData.password);
        if (!error) {
          // Login bem-sucedido - aguardar role ser carregada
          // O MainLayout vai fazer o redirecionamento apropriado
          const redirectTo = searchParams.get('redirect') || '/';
          navigate(redirectTo);
        }
      } else {
        // Para ambos os tipos, coletar dados no onboarding antes de criar a conta
        if (userType === "organizer") {
          navigate('/organizer-onboarding', {
            state: {
              email: formData.email,
              password: formData.password,
              name: formData.name,
            }
          });
        } else {
          // Fluxo de usuário: coletar dados no onboarding antes de criar a conta
          navigate('/user-onboarding', {
            state: {
              email: formData.email,
              password: formData.password,
              name: formData.name,
            }
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Theme Toggle */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Type Toggle */}
        <div className="flex items-center justify-center">
          <div className="flex bg-surface rounded-lg p-1 border border-border">
            <button type="button" onClick={() => setUserType("user")} className={`px-4 py-2 text-sm font-medium rounded-md transition-smooth ${userType === "user" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              👤 Usuário
            </button>
            <button type="button" onClick={() => setUserType("organizer")} className={`px-4 py-2 text-sm font-medium rounded-md transition-smooth ${userType === "organizer" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              🎯 Organizador
            </button>
          </div>
        </div>

        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <h1 className="font-bold gradient-primary bg-clip-text text-[#147dc7] text-4xl">MeetLines</h1>
          <p className="text-muted-foreground">
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
            {userType === "organizer" && " de organizador"}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="name" type="text" placeholder="Seu nome" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} className="pl-10" required={!isLogin} />
              </div>
            </div>}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} className="pl-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Sua senha" value={formData.password} onChange={e => handleInputChange("password", e.target.value)} className="pl-10 pr-10" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="glow" size="lg" className="w-full" disabled={loading}>
            {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
          </Button>
        </form>

        {/* Toggle Auth Mode */}
        <div className="text-center">
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-primary transition-smooth">
            {isLogin ? "Não tem uma conta? " : "Já tem uma conta? "}
            <span className="text-primary font-medium">
              {isLogin ? "Cadastre-se" : "Entre"}
            </span>
          </button>
        </div>

        {/* Demo Login */}
        
        {/* Footer */}
        <div className="text-center pt-6 pb-4">
          <p className="text-xs text-muted-foreground">
            Esse site foi desenvolvido pela <a href="https://flatgrowth.com.br/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Flat Company</a>
          </p>
        </div>
      </div>
    </div>;
}