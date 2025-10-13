import { useState, useEffect, useRef } from "react";
import { Camera, X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Capacitor } from "@capacitor/core";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { Html5Qrcode } from "html5-qrcode";
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
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [forceWebScanner, setForceWebScanner] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Initialize Web scanner only after the dialog content is mounted
  useEffect(() => {
    if (!isScanning || (isNative && !forceWebScanner)) return;
    let cancelled = false;

    const init = async () => {
      try {
        // Wait for the #qr-reader element to exist in the DOM
        for (let i = 0; i < 20; i++) {
          if (document.getElementById("qr-reader")) break;
          await new Promise((r) => setTimeout(r, 50));
        }
        if (cancelled) return;

        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            try {
              await html5QrCode.stop().catch(() => {});
            } finally {
              setIsScanning(false);
            }
            await validateTicket(decodedText);
          },
          () => {}
        );
      } catch (error: any) {
        console.error('Error starting web scanner:', error);
        toast.error('Erro ao acessar câmera. Use o código manual.');
        setIsScanning(false);
        setManualCodeInput(true);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [isScanning, isNative]);

  const startScan = async () => {
    if (isNative) {
      await startNativeScan();
    } else {
      // Only toggles dialog; actual scanner starts in the effect above
      setIsScanning(true);
    }
  };

  const startNativeScan = async () => {
    try {
      const permission = await BarcodeScanner.requestPermissions();
      if (permission.camera !== 'granted') {
        toast.error('Permissão de câmera negada');
        return;
      }

      setIsScanning(true);
      const result = await BarcodeScanner.scan();

      if (result.barcodes && result.barcodes.length > 0) {
        const ticketId = result.barcodes[0].rawValue;
        await validateTicket(ticketId);
      }

      setIsScanning(false);
    } catch (error: any) {
      console.error('Error scanning QR code:', error);
      toast.error('Erro ao escanear QR Code');
      // Fallback to web scanner when native scan fails
      setForceWebScanner(true);
      setIsScanning(true);
    }
  };

  const startWebScan = async () => {
    setIsScanning(true);
  };

  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        // @ts-ignore - optional API
        // Clear preview if available
        (scannerRef.current as any).clear?.();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setForceWebScanner(false);
    setIsScanning(false);
  };

  const handleManualValidation = async () => {
    if (!manualCode.trim()) {
      toast.error('Digite o código do ingresso');
      return;
    }
    await validateTicket(manualCode.trim());
    setManualCode("");
    setManualCodeInput(false);
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

      // Buscar perfil do usuário separadamente
      let userProfile = null;
      if (ticket.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('user_id', ticket.user_id)
          .maybeSingle();
        
        userProfile = profile;
      }

      // Verificar se já foi validado
      if (ticket.validated_at) {
        setScannedTicket({ ...ticket, user: userProfile });
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

      setScannedTicket({ ...ticket, validated_at: new Date().toISOString(), user: userProfile });
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
        onClick={() => setOptionsDialogOpen(true)}
        disabled={isScanning}
        size="sm"
        variant="outline"
      >
        <Camera className="h-4 w-4 mr-2" />
        Validar
      </Button>

      {/* Options Dialog */}
      <Dialog open={optionsDialogOpen} onOpenChange={setOptionsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Validar Ingresso</DialogTitle>
            <DialogDescription>
              Escolha como deseja validar o ingresso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button 
              className="w-full h-20 flex flex-col gap-2"
              onClick={() => {
                setOptionsDialogOpen(false);
                setForceWebScanner(false);
                startScan();
              }}
            >
              <Camera className="h-6 w-6" />
              <span>Escanear QR Code</span>
            </Button>
            <Button 
              variant="outline"
              className="w-full h-20 flex flex-col gap-2"
              onClick={() => {
                setOptionsDialogOpen(false);
                setManualCodeInput(true);
              }}
            >
              <Keyboard className="h-6 w-6" />
              <span>Digitar Código</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Web Scanner Dialog */}
      <Dialog open={isScanning && (!isNative || forceWebScanner)} onOpenChange={(open) => !open && stopScan()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear QR Code</DialogTitle>
            <DialogDescription>
              Posicione o QR Code do ingresso na câmera
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div id="qr-reader" className="w-full"></div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  stopScan();
                  setManualCodeInput(true);
                }}
              >
                Código Manual
              </Button>
              <Button 
                variant="outline" 
                onClick={stopScan}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Code Input Dialog */}
      <Dialog open={manualCodeInput} onOpenChange={setManualCodeInput}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código Manual</DialogTitle>
            <DialogDescription>
              Digite o código do ingresso manualmente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-code">Código do Ingresso</Label>
              <Input
                id="manual-code"
                placeholder="Cole o código aqui"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualValidation()}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setManualCodeInput(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                onClick={handleManualValidation}
              >
                Validar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Info Dialog */}
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
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={scannedTicket.user?.avatar_url} />
                  <AvatarFallback>
                    {scannedTicket.buyer_name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{scannedTicket.buyer_name}</p>
                  <p className="text-sm text-muted-foreground">{scannedTicket.user?.display_name || scannedTicket.buyer_email}</p>
                </div>
              </div>
              
              <div className="space-y-3">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
