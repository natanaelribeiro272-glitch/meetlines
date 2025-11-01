import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

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
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64?: string;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [loading, setLoading] = useState(true);
  const mpRef = useRef<any>(null);

  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

    if (!publicKey) {
      onPaymentError("Chave pública do Mercado Pago não configurada");
      return;
    }

    const loadMercadoPago = async () => {
      if (window.MercadoPago) {
        initializePayment(publicKey);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => {
        initializePayment(publicKey);
      };
      script.onerror = () => {
        onPaymentError("Erro ao carregar Mercado Pago SDK");
        setLoading(false);
      };
      document.body.appendChild(script);
    };

    const initializePayment = async (publicKey: string) => {
      try {
        const mp = new window.MercadoPago(publicKey, {
          locale: "pt-BR",
        });
        mpRef.current = mp;

        const bricksBuilder = mp.bricks();

        const renderPaymentBrick = async () => {
          const settings = {
            initialization: {
              amount: amount,
              preferenceId: preferenceId,
              payer: {
                email: "",
              },
            },
            customization: {
              paymentMethods: {
                minInstallments: 1,
                maxInstallments: 1,
              },
              visual: {
                style: {
                  theme: "default",
                },
              },
            },
            callbacks: {
              onReady: () => {
                console.log("[MercadoPago] Payment Brick ready");
                setLoading(false);
              },
              onSubmit: ({ selectedPaymentMethod, formData }: any) => {
                return new Promise((resolve, reject) => {
                  console.log("[MercadoPago] Payment submitted:", { selectedPaymentMethod, formData });

                  if (selectedPaymentMethod === "pix") {
                    setPixData({
                      qrCode: formData.transaction_details?.external_resource_url || "",
                      qrCodeBase64: formData.point_of_interaction?.transaction_data?.qr_code_base64,
                    });
                  }

                  setTimeout(() => {
                    onPaymentSuccess();
                    resolve(formData);
                  }, 1000);
                });
              },
              onError: (error: any) => {
                console.error("[MercadoPago] Error:", error);
                onPaymentError(error.message || "Erro no pagamento");
                setLoading(false);
              },
            },
          };

          await bricksBuilder.create("payment", "payment-brick-container", settings);
        };

        renderPaymentBrick();
      } catch (error) {
        console.error("[MercadoPago] Initialization error:", error);
        onPaymentError("Erro ao inicializar pagamento");
        setLoading(false);
      }
    };

    loadMercadoPago();

    return () => {
      if (mpRef.current) {
        try {
          mpRef.current = null;
        } catch (error) {
          console.error("Error cleaning up MercadoPago:", error);
        }
      }
    };
  }, [preferenceId, amount, onPaymentSuccess, onPaymentError]);

  const copyPixCode = async () => {
    if (!pixData?.qrCode) return;

    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopiedPix(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopiedPix(false), 3000);
    } catch (error) {
      toast.error("Erro ao copiar código PIX");
    }
  };

  if (pixData) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
            <QRCode value={pixData.qrCode} size={256} />
          </div>

          <div className="w-full space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Escaneie o QR Code com o app do seu banco ou copie o código PIX
            </p>

            <div className="flex gap-2">
              <Input
                value={pixData.qrCode}
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

            <p className="text-xs text-center text-muted-foreground">
              Após o pagamento, você receberá seus ingressos por e-mail
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div id="payment-brick-container"></div>
    </div>
  );
}
