import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Loader, Zap, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface StripeConnectStatus {
  connected: boolean;
  account_id?: string;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements?: {
    currently_due?: string[];
    eventually_due?: string[];
  };
}

interface StripeConnectSetupProps {
  organizerId: string;
}

export default function StripeConnectSetup({ organizerId }: StripeConnectSetupProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [paymentPreference, setPaymentPreference] = useState<'stripe_direct' | 'platform_transfer'>('platform_transfer');
  const [savingPreference, setSavingPreference] = useState(false);

  useEffect(() => {
    checkStripeStatus();
    loadPaymentPreference();
    const interval = setInterval(checkStripeStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPaymentPreference = async () => {
    try {
      const { data, error } = await supabase
        .from('organizers')
        .select('payment_preference')
        .eq('id', organizerId)
        .maybeSingle();

      if (error) throw error;
      if (data?.payment_preference) {
        setPaymentPreference(data.payment_preference as 'stripe_direct' | 'platform_transfer');
      }
    } catch (error) {
      console.error("Error loading payment preference:", error);
    }
  };

  const savePaymentPreference = async (preference: 'stripe_direct' | 'platform_transfer') => {
    try {
      setSavingPreference(true);
      const { error } = await supabase
        .from('organizers')
        .update({ payment_preference: preference })
        .eq('id', organizerId);

      if (error) throw error;

      setPaymentPreference(preference);
      toast({
        title: "Preferência salva!",
        description: preference === 'stripe_direct'
          ? "Pagamentos serão transferidos automaticamente para sua conta Stripe"
          : "Pagamentos serão processados pela plataforma e transferidos em 3 dias úteis após o evento",
      });
    } catch (error: any) {
      console.error("Error saving payment preference:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingPreference(false);
    }
  };

  const checkStripeStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-stripe-connect-status`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check Stripe status");
      }

      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error checking Stripe status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-connect-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao conectar Stripe");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Erro",
          description: "URL de redirecionamento não disponível",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error connecting Stripe:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao conectar Stripe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader className="h-5 w-5 animate-spin" />
            Verificando status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>Erro ao carregar informações</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Stripe Connect</span>
          {status.payouts_enabled && (
            <Badge className="bg-green-600 hover:bg-green-700">Ativo</Badge>
          )}
          {status.connected && !status.payouts_enabled && (
            <Badge className="bg-amber-600 hover:bg-amber-700">Pendente</Badge>
          )}
          {!status.connected && (
            <Badge variant="outline">Não conectado</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Receba pagamentos direto na sua conta bancária
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status.connected ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Conecte sua conta Stripe para receber pagamentos direto da venda de ingressos
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleConnectStripe}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Conectando..." : "Conectar Stripe Connect"}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {status.charges_enabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-600" />
                )}
                <div className="text-sm">
                  <p className="font-medium">Aceitar Pagamentos</p>
                  <p className="text-xs text-muted-foreground">
                    {status.charges_enabled ? "Ativo" : "Pendente"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {status.payouts_enabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-600" />
                )}
                <div className="text-sm">
                  <p className="font-medium">Receber Transferências</p>
                  <p className="text-xs text-muted-foreground">
                    {status.payouts_enabled ? "Ativo" : "Pendente"}
                  </p>
                </div>
              </div>
            </div>

            {status.payouts_enabled && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Método de Recebimento</h4>
                    <p className="text-xs text-muted-foreground">
                      Escolha como deseja receber o pagamento das vendas de ingressos
                    </p>
                  </div>
                  <RadioGroup
                    value={paymentPreference}
                    onValueChange={(value) => savePaymentPreference(value as 'stripe_direct' | 'platform_transfer')}
                    disabled={savingPreference}
                    className="space-y-3"
                  >
                    <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-muted hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="stripe_direct" id="stripe_direct" className="mt-1" />
                      <Label htmlFor="stripe_direct" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Transferência Imediata (Stripe)</span>
                          <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          O pagamento é transferido automaticamente para sua conta Stripe após cada venda.
                          Taxas da plataforma são deduzidas automaticamente e você recebe o valor líquido conforme o cronograma do Stripe.
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-muted hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="platform_transfer" id="platform_transfer" className="mt-1" />
                      <Label htmlFor="platform_transfer" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">Repasse via Plataforma</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          A plataforma processa os pagamentos e realiza a transferência em até 3 dias úteis após o evento.
                          Você receberá um resumo detalhado de todas as transações antes da transferência.
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {!status.onboarding_complete && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Finalize seu cadastro no Stripe para ativar pagamentos
                </AlertDescription>
              </Alert>
            )}

            {status.requirements?.currently_due && status.requirements.currently_due.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <p className="font-medium mb-1">Documentos faltantes:</p>
                  <ul className="text-xs space-y-1 ml-4 list-disc">
                    {status.requirements.currently_due.map((req) => (
                      <li key={req}>{req}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleConnectStripe}
              variant="outline"
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Acessar Painel Stripe
            </Button>

            {status.account_id && (
              <p className="text-xs text-muted-foreground text-center">
                ID da conta: {status.account_id.slice(0, 10)}...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
