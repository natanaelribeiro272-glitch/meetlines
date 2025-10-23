import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganizer } from "@/hooks/useOrganizer";

export function StripeConnectOnboarding() {
  const { organizerData, refetchOrganizer } = useOrganizer();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    onboarding_complete: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
  } | null>(null);

  useEffect(() => {
    checkStatus();
  }, [organizerData?.stripe_account_id]);

  const checkStatus = async () => {
    if (!organizerData?.stripe_account_id) {
      setStatus({
        connected: false,
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
      });
      return;
    }

    try {
      setChecking(true);
      const { data, error } = await supabase.functions.invoke("check-stripe-connect-status");

      if (error) throw error;

      setStatus(data);
      await refetchOrganizer();
    } catch (error) {
      console.error("Error checking Stripe status:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke("create-stripe-connect-account");

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de onboarding não recebida");
      }
    } catch (error) {
      console.error("Error creating Stripe Connect account:", error);
      toast.error("Erro ao conectar com Stripe. Tente novamente.");
      setLoading(false);
    }
  };

  const isFullyConnected = status?.connected && status?.onboarding_complete && status?.charges_enabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pagamentos via Stripe
        </CardTitle>
        <CardDescription>
          Configure sua conta Stripe para receber pagamentos de ingressos diretamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {checking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status da Conexão</span>
                {isFullyConnected ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                ) : status?.connected ? (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Configuração Pendente
                  </Badge>
                ) : (
                  <Badge variant="outline">Não Conectado</Badge>
                )}
              </div>

              {status?.connected && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Onboarding Completo</span>
                    {status.onboarding_complete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pode Receber Pagamentos</span>
                    {status.charges_enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pode Receber Transferências</span>
                    {status.payouts_enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </>
              )}
            </div>

            {!isFullyConnected && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {status?.connected
                        ? "Complete sua configuração no Stripe"
                        : "Configure pagamentos para seus eventos"}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {status?.connected
                        ? "Você precisa completar o processo de verificação no Stripe para começar a receber pagamentos."
                        : "Conecte sua conta Stripe para vender ingressos e receber pagamentos diretamente na sua conta bancária."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isFullyConnected && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Conta conectada com sucesso!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Você já pode vender ingressos e receber pagamentos. Os fundos serão transferidos automaticamente para sua conta bancária.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleConnect}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : status?.connected ? (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {isFullyConnected ? "Gerenciar Conta Stripe" : "Continuar Configuração"}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Conectar com Stripe
                  </>
                )}
              </Button>

              {status?.connected && (
                <Button
                  onClick={checkStatus}
                  variant="outline"
                  className="w-full"
                  disabled={checking}
                >
                  {checking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Atualizar Status"
                  )}
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• A plataforma cobra uma taxa de serviço por transação</p>
              <p>• Você recebe os pagamentos diretamente na sua conta bancária</p>
              <p>• Processo de verificação seguro pelo Stripe</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
