import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
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
          // Redirect to the page they came from
          const redirectTo = searchParams.get('redirect') || '/';
          navigate(redirectTo);
        }
      } else {
        const {
          error
        } = await signUp(formData.email, formData.password, formData.name, userType);
        if (!error) {
          // Success handled by auth provider
          const redirectTo = searchParams.get('redirect') || '/';
          navigate(redirectTo);
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

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Social Auth */}
        <div className="space-y-3">
          <Button variant="outline" size="lg" className="w-full">
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar com Google
          </Button>
          
          <Button variant="outline" size="lg" className="w-full">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continuar com Facebook
          </Button>
        </div>

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
        
      </div>
    </div>;
}