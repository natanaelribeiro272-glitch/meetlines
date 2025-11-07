import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MercadoPagoPaymentProps {
  qrCode: string;
  qrCodeBase64?: string;
  expirationDate?: string;
  paymentId: string;
  ticketSaleId?: string;
  onPaymentVerified?: () => void;
}

export function MercadoPagoPayment({
  qrCode,
  qrCodeBase64,
  expirationDate,
  paymentId,
  ticketSaleId,
  onPaymentVerified,
}: MercadoPagoPaymentProps) {
  const [copiedPix, setCopiedPix] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const copyPixCode = async () => {
    if (!qrCode) return;

    try {
      await navigator.clipboard.writeText(qrCode);
      setCopiedPix(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopiedPix(false), 3000);
    } catch (error) {
      toast.error("Erro ao copiar código PIX");
    }
  };

  const verifyPayment = async () => {
    if (!paymentId) {
      toast.error("ID de pagamento não encontrado");
      return;
    }

    setVerifying(true);
    try {
      console.log("[MercadoPago Payment] Verifying payment:", { paymentId, ticketSaleId });

      const { data, error } = await supabase.functions.invoke(
        "verify-mercadopago-payment",
        {
          body: { paymentId, ticketSaleId },
        }
      );

      console.log("[MercadoPago Payment] Response:", { data, error });
      console.log("[MercadoPago Payment] Data type:", typeof data);
      console.log("[MercadoPago Payment] Data keys:", data ? Object.keys(data) : 'null');

      if (data?.error) {
        console.error("[MercadoPago Payment] Error in response data:", data.error);
        console.error("[MercadoPago Payment] Error type:", typeof data.error);
        console.error("[MercadoPago Payment] Error stringified:", JSON.stringify(data.error, null, 2));

        let errorMsg = "Erro ao verificar pagamento";
        if (typeof data.error === 'string') {
          errorMsg = data.error;
        } else if (data.error && typeof data.error === 'object') {
          errorMsg = data.error.message || data.error.error || JSON.stringify(data.error);
        }

        toast.error(errorMsg, {
          description: data.details || "Tente novamente em alguns segundos",
          duration: 5000,
        });
        return;
      }

      if (error) {
        console.error("[MercadoPago Payment] Error from function:", error);
        const errorMessage = error.message || "Erro desconhecido ao verificar pagamento";
        toast.error(errorMessage, {
          description: "Tente novamente em alguns segundos",
          duration: 5000,
        });
        return;
      }

      if (data?.payment_status === "approved" || data?.payment_status === "completed") {
        toast.success("Pagamento confirmado! Seus ingressos foram gerados.");
        if (onPaymentVerified) {
          onPaymentVerified();
        }
      } else if (data?.payment_status === "pending") {
        toast.info("Pagamento ainda pendente. Aguarde alguns instantes e tente novamente.");
      } else {
        toast.warning("Pagamento não identificado ainda. Tente novamente em alguns segundos.");
      }
    } catch (error) {
      console.error("[MercadoPago Payment] Exception:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao verificar pagamento", {
        description: errorMsg,
        duration: 5000,
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
          <QRCode value={qrCode} size={256} />
        </div>

        <div className="w-full space-y-3">
          <p className="text-sm text-center text-muted-foreground">
            Escaneie o QR Code com o app do seu banco ou copie o código PIX
          </p>

          <div className="flex gap-2">
            <Input
              value={qrCode}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              onClick={copyPixCode}
              variant="outline"
              className="shrink-0"
            >
              {copiedPix ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900">
              Instruções:
            </p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Abra o app do seu banco</li>
              <li>Escolha pagar com PIX QR Code</li>
              <li>Escaneie o código ou cole a chave PIX</li>
              <li>Confirme o pagamento</li>
            </ol>
          </div>

          {expirationDate && (
            <p className="text-xs text-center text-muted-foreground">
              Este código expira em {new Date(expirationDate).toLocaleString('pt-BR')}
            </p>
          )}

          <Button
            onClick={verifyPayment}
            disabled={verifying}
            className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
            size="lg"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? "Verificando..." : "Já Fiz o Pagamento - Verificar"}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-2">
            Após confirmar o pagamento, clique no botão acima para verificar
          </p>
        </div>
      </div>
    </div>
  );
}
