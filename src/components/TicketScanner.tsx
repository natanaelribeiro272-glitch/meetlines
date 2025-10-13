import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface TicketScannerProps {
  eventId: string;
}

export default function TicketScanner({ eventId }: TicketScannerProps) {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTicket, setScannedTicket] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const startScan = async () => {
    try {
      // Request camera permission
      const permission = await BarcodeScanner.requestPermissions();
      
      if (permission.camera !== 'granted') {
        toast.error('Permissão de câmera negada');
        return;
      }

      setIsScanning(true);

      // Start scanning
      const result = await BarcodeScanner.scan();

      if (result.barcodes && result.barcodes.length > 0) {
        const ticketId = result.barcodes[0].rawValue;
        await validateTicket(ticketId);
      }
    } catch (error: any) {
      console.error('Error scanning QR code:', error);
      toast.error('Erro ao escanear QR Code');
    } finally {
      setIsScanning(false);
    }
  };

  const validateTicket = async (ticketId: string) => {
    try {
      // Buscar o ingresso no banco de dados
      const { data: ticket, error } = await supabase
        .from('ticket_sales')
        .select(`
          *,
          event:events!inner(id, title),
          ticket_type:ticket_types(name)
        `)
        .eq('id', ticketId)
        .eq('event_id', eventId)
        .eq('payment_status', 'completed')
        .maybeSingle();

      if (error) throw error;

      if (!ticket) {
        toast.error('Ingresso não encontrado ou inválido');
        return;
      }

      // Verificar se já foi validado
      if (ticket.validated_at) {
        setScannedTicket(ticket);
        setDialogOpen(true);
        toast.warning('Ingresso já foi validado anteriormente');
        return;
      }

      // Validar o ingresso
      const { error: updateError } = await supabase
        .from('ticket_sales')
        .update({
          validated_at: new Date().toISOString(),
          validated_by: user?.id
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      setScannedTicket({ ...ticket, validated_at: new Date().toISOString() });
      setDialogOpen(true);
      toast.success('Ingresso validado com sucesso!');
    } catch (error: any) {
      console.error('Error validating ticket:', error);
      toast.error('Erro ao validar ingresso');
    }
  };

  return (
    <>
      <Button
        onClick={startScan}
        disabled={isScanning}
        size="sm"
        variant="outline"
      >
        <Camera className="h-4 w-4 mr-2" />
        {isScanning ? 'Escaneando...' : 'Validar Ingresso'}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {scannedTicket?.validated_at && new Date(scannedTicket.validated_at).getTime() < Date.now() - 1000
                ? 'Ingresso Já Validado'
                : 'Ingresso Validado!'
              }
            </DialogTitle>
            <DialogDescription>
              Informações do ingresso
            </DialogDescription>
          </DialogHeader>
          {scannedTicket && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Titular</p>
                <p className="font-semibold">{scannedTicket.buyer_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{scannedTicket.buyer_email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo de Ingresso</p>
                <p className="text-sm">{scannedTicket.ticket_type?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Quantidade</p>
                <p className="text-sm">{scannedTicket.quantity}x</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="text-sm">R$ {scannedTicket.total_amount.toFixed(2)}</p>
              </div>
              {scannedTicket.validated_at && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Validado em</p>
                  <p className="text-sm">
                    {new Date(scannedTicket.validated_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
