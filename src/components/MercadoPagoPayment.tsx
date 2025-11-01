import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoPaymentProps {
  preferenceId: string;
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

export function MercadoPagoPayment({
  preferenceId,
  amount,
  onPaymentSuccess,
  onPaymentError,
}: MercadoPagoPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [checkoutReady, setCheckoutReady] = useState(false);

  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

    console.log("[MercadoPago] Public Key:", publicKey ? "✓ Present" : "✗ Missing");
    console.log("[MercadoPago] Preference ID:", preferenceId);
    console.log("[MercadoPago] Amount:", amount);

    if (!publicKey) {
      const error = "Chave pública do Mercado Pago não configurada";
      console.error("[MercadoPago]", error);
      onPaymentError(error);
      setLoading(false);
      return;
    }

    if (!preferenceId) {
      const error = "Preference ID não fornecido";
      console.error("[MercadoPago]", error);
      onPaymentError(error);
      setLoading(false);
      return;
    }

    const loadMercadoPago = () => {
      if (window.MercadoPago) {
        console.log("[MercadoPago] SDK already loaded");
        setCheckoutReady(true);
        setLoading(false);
        return;
      }

      console.log("[MercadoPago] Loading SDK...");
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => {
        console.log("[MercadoPago] SDK loaded successfully");
        setCheckoutReady(true);
        setLoading(false);
      };
      script.onerror = () => {
        console.error("[MercadoPago] Failed to load SDK");
        onPaymentError("Erro ao carregar Mercado Pago SDK");
        setLoading(false);
      };
      document.body.appendChild(script);
    };

    loadMercadoPago();
  }, [preferenceId, amount, onPaymentError]);

  const openCheckout = () => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

    try {
      console.log("[MercadoPago] Opening Checkout Pro");
      const mp = new window.MercadoPago(publicKey, {
        locale: "pt-BR",
      });

      mp.checkout({
        preference: {
          id: preferenceId,
        },
        autoOpen: true,
      });

      toast.info("Aguardando pagamento...", {
        description: "Complete o pagamento na janela do Mercado Pago",
        duration: 5000,
      });
    } catch (error) {
      console.error("[MercadoPago] Error opening checkout:", error);
      onPaymentError("Erro ao abrir checkout: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Carregando checkout do Mercado Pago...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">
            Pagamento via Mercado Pago
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            Valor total: <span className="font-semibold text-foreground">R$ {amount.toFixed(2)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Clique no botão abaixo para abrir o checkout
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-blue-900">
          Formas de pagamento disponíveis:
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>PIX (pagamento instantâneo)</li>
          <li>Cartão de crédito</li>
          <li>Cartão de débito</li>
        </ul>
      </div>

      <Button
        onClick={openCheckout}
        className="w-full h-12 text-base font-semibold"
        size="lg"
        disabled={!checkoutReady}
      >
        {checkoutReady ? "Abrir Checkout Mercado Pago" : "Carregando..."}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Você será redirecionado para o ambiente seguro do Mercado Pago
      </p>
    </div>
  );
}
