import { useLocation, Navigate } from "react-router-dom";
import { Mail, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function EmailConfirmation() {
  const location = useLocation();
  const email = location.state?.email;

  if (!email) {
    return <Navigate to="/auth" replace />;
  }

  const openEmailApp = () => {
    const domain = email.split('@')[1]?.toLowerCase();

    const emailProviders: { [key: string]: string } = {
      'gmail.com': 'https://mail.google.com',
      'outlook.com': 'https://outlook.live.com',
      'hotmail.com': 'https://outlook.live.com',
      'yahoo.com': 'https://mail.yahoo.com',
      'icloud.com': 'https://www.icloud.com/mail',
    };

    const providerUrl = emailProviders[domain];

    if (providerUrl) {
      window.open(providerUrl, '_blank');
    } else {
      window.location.href = 'mailto:';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Verifique seu email</h1>
          <p className="text-muted-foreground">
            Enviamos um link de confirmação para
          </p>
          <p className="font-medium text-primary">{email}</p>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">
                Próximos passos:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abra seu email</li>
                <li>Clique no link de confirmação</li>
                <li>Complete seu cadastro</li>
              </ol>
            </div>
          </div>

          <p className="text-center text-xs">
            Não recebeu o email? Verifique sua caixa de spam ou lixo eletrônico
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <Button
            className="w-full"
            onClick={openEmailApp}
          >
            <Mail className="h-4 w-4 mr-2" />
            Abrir email
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = "/auth"}
          >
            Voltar para login
          </Button>
        </div>
      </Card>
    </div>
  );
}
