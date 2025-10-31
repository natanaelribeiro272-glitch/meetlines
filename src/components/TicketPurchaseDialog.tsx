import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  quantity_sold?: number;
  min_quantity_per_purchase?: number;
  max_quantity_per_purchase?: number;
}

interface TicketSettings {
  platform_fee_percentage: number;
  payment_processing_fee_percentage: number;
  payment_processing_fee_fixed: number;
  fee_payer: string;
}

interface TicketPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketTypes: TicketType[];
  ticketSettings: TicketSettings;
  eventId: string;
  eventTitle: string;
}

export function TicketPurchaseDialog({
  open,
  onOpenChange,
  ticketTypes,
  ticketSettings,
  eventId,
  eventTitle,
}: TicketPurchaseDialogProps) {
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const updateQuantity = (ticketId: string, change: number) => {
    const ticket = ticketTypes.find(t => t.id === ticketId);
    if (!ticket) return;

    const currentQty = selectedTickets[ticketId] || 0;
    const maxQty = ticket.max_quantity_per_purchase || 10;
    const newQty = Math.max(0, Math.min(maxQty, currentQty + change));
    const available = ticket.quantity - (ticket.quantity_sold || 0);

    if (newQty > available) {
      toast.error(`Apenas ${available} ingressos disponíveis`);
      return;
    }

    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: newQty,
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalQuantity = 0;

    Object.entries(selectedTickets).forEach(([ticketId, qty]) => {
      const ticket = ticketTypes.find(t => t.id === ticketId);
      if (ticket && qty > 0) {
        subtotal += ticket.price * qty;
        totalQuantity += qty;
      }
    });

    const platformFee = subtotal * (ticketSettings.platform_fee_percentage / 100);
    const processingFee = 
      subtotal * (ticketSettings.payment_processing_fee_percentage / 100) +
      (ticketSettings.payment_processing_fee_fixed * totalQuantity);

    const total = ticketSettings.fee_payer === 'buyer' 
      ? subtotal + platformFee + processingFee
      : subtotal;

    return { subtotal, platformFee, processingFee, total, totalQuantity };
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      console.log('[TicketPurchase] Starting checkout process');

      const selectedTicketIds = Object.keys(selectedTickets).filter(
        id => selectedTickets[id] > 0
      );
      console.log('[TicketPurchase] Selected tickets:', selectedTicketIds);

      if (selectedTicketIds.length === 0) {
        toast.error("Selecione pelo menos um ingresso");
        return;
      }

      const firstTicketId = selectedTicketIds[0];
      const quantity = selectedTickets[firstTicketId];
      console.log('[TicketPurchase] Invoking function with:', { firstTicketId, quantity, eventId });

      const response = await supabase.functions.invoke("create-ticket-checkout", {
        body: {
          ticketTypeId: firstTicketId,
          quantity,
          eventId,
        },
      });

      console.log('[TicketPurchase] Full response:', response);
      console.log('[TicketPurchase] Response data:', response.data);
      console.log('[TicketPurchase] Response error:', response.error);

      if (response.error) {
        console.error('[TicketPurchase] Function error:', response.error);

        if (response.error.message) {
          throw new Error(response.error.message);
        }

        const errorDetails = typeof response.error === 'object'
          ? JSON.stringify(response.error, null, 2)
          : String(response.error);

        throw new Error(`Erro na função: ${errorDetails}`);
      }

      const data = response.data;

      if (!data) {
        throw new Error("Nenhum dado retornado da função");
      }

      if (data.error) {
        console.error('[TicketPurchase] Data contains error:', data.error);

        if (data.error.includes('ainda não configurou pagamentos')) {
          toast.error(data.error, {
            duration: 6000,
            description: "O organizador precisa conectar sua conta Stripe antes de vender ingressos."
          });
          return;
        }

        throw new Error(data.error);
      }

      if (data?.url) {
        console.log('[TicketPurchase] Redirecting to:', data.url);
        window.location.href = data.url;
        onOpenChange(false);
        toast.success("Redirecionando para o checkout...");
      } else {
        console.error('[TicketPurchase] No URL in response:', data);
        throw new Error("URL de checkout não recebida");
      }
    } catch (error) {
      console.error("[TicketPurchase] Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao processar compra: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Comprar Ingressos</DialogTitle>
          <p className="text-muted-foreground">{eventTitle}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ticket Types */}
          <div className="space-y-4">
            {ticketTypes.map((ticket) => {
              const available = ticket.quantity - (ticket.quantity_sold || 0);
              const quantity = selectedTickets[ticket.id] || 0;

              return (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{ticket.name}</h3>
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {ticket.description}
                        </p>
                      )}
                      <Badge variant="secondary" className="mt-2">
                        {available} disponíveis
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        R$ {ticket.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(ticket.id, -1)}
                        disabled={quantity === 0 || loading}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-medium w-12 text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(ticket.id, 1)}
                        disabled={quantity >= available || loading}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {quantity > 0 && (
                      <p className="text-lg font-semibold">
                        R$ {(ticket.price * quantity).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totals.totalQuantity > 0 && (
            <>
              <Separator />

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({totals.totalQuantity} ingresso{totals.totalQuantity > 1 ? 's' : ''})</span>
                  <span>R$ {totals.subtotal.toFixed(2)}</span>
                </div>

                {ticketSettings.fee_payer === 'buyer' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Taxa da plataforma ({ticketSettings.platform_fee_percentage}%)
                      </span>
                      <span>R$ {totals.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de processamento</span>
                      <span>R$ {totals.processingFee.toFixed(2)}</span>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-green-600">R$ {totals.total.toFixed(2)}</span>
                </div>

                {ticketSettings.fee_payer === 'organizer' && (
                  <p className="text-xs text-muted-foreground">
                    *As taxas serão deduzidas do valor repassado ao organizador
                  </p>
                )}
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                onClick={handleCheckout}
                disabled={loading}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {loading ? "Processando..." : "Finalizar Compra"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
