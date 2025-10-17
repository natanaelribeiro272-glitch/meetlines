import { AlertCircle, Copy, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PlatformRestrictedFeatureAlertProps {
  featureName?: string;
  description?: string;
}

export default function PlatformRestrictedFeatureAlert({
  featureName = "venda de ingressos pela plataforma",
  description = "Esta funcionalidade está disponível apenas através do navegador web. Para continuar, acesse pelo computador ou abra este link no navegador do seu celular."
}: PlatformRestrictedFeatureAlertProps) {

  const handleCopyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast.success("Link copiado! Cole no navegador para continuar.");
    }).catch(() => {
      toast.error("Erro ao copiar link");
    });
  };

  const handleOpenInBrowser = () => {
    const currentUrl = window.location.href;
    window.open(currentUrl, '_blank');
  };

  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-500 font-semibold">
        Recurso disponível apenas no navegador
      </AlertTitle>
      <AlertDescription className="space-y-3 mt-2">
        <p className="text-sm text-foreground/80">
          A funcionalidade de <strong>{featureName}</strong> requer acesso através do navegador web.
        </p>
        <p className="text-sm text-foreground/80">
          {description}
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="w-full justify-start gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar link desta página
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInBrowser}
            className="w-full justify-start gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir no navegador
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Dica: Você pode criar eventos gratuitos normalmente pelo app. A restrição aplica-se apenas à venda de ingressos.
        </p>
      </AlertDescription>
    </Alert>
  );
}
