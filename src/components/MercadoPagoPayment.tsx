import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { useState } from "react";

interface MercadoPagoPaymentProps {
  qrCode: string;
  qrCodeBase64?: string;
  expirationDate?: string;
}

export function MercadoPagoPayment({
  qrCode,
  qrCodeBase64,
  expirationDate,
}: MercadoPagoPaymentProps) {
  const [copiedPix, setCopiedPix] = useState(false);

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

          <p className="text-xs text-center text-muted-foreground">
            Após o pagamento, você receberá seus ingressos por e-mail
          </p>
        </div>
      </div>
    </div>
  );
}
