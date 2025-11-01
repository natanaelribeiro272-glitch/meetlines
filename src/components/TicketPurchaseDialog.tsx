import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MercadoPagoPayment } from "./MercadoPagoPayment";

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
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [verifyingPromo, setVerifyingPromo] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64?: string;
    paymentId: string;
    expirationDate?: string;
  } | null>(null);

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

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Digite um código promocional");
      return;
    }

    setVerifyingPromo(true);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("event_id", eventId)
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Código promocional inválido");
        return;
      }

      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        toast.error("Este código ainda não está válido");
        return;
      }

      if (data.valid_until && new Date(data.valid_until) < now) {
        toast.error("Este código expirou");
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error("Este código atingiu o limite de usos");
        return;
      }

      const { subtotal } = calculateTotals();
      if (data.min_purchase_amount > 0 && subtotal < data.min_purchase_amount) {
        toast.error(`Compra mínima de R$ ${data.min_purchase_amount.toFixed(2)} para este código`);
        return;
      }

      setAppliedPromo(data);
      const discountText = data.discount_type === "percentage"
        ? `${data.discount_value}%`
        : `R$ ${data.discount_value.toFixed(2)}`;
      toast.success(`Código aplicado! Desconto de ${discountText}`);
    } catch (error) {
      console.error("Error applying promo code:", error);
      toast.error("Erro ao validar código promocional");
    } finally {
      setVerifyingPromo(false);
    }
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

    let promoDiscount = 0;
    if (appliedPromo) {
      if (appliedPromo.discount_type === "percentage") {
        promoDiscount = subtotal * (appliedPromo.discount_value / 100);
      } else {
        promoDiscount = appliedPromo.discount_value;
      }
      promoDiscount = Math.min(promoDiscount, subtotal);
    }

    const subtotalAfterPromo = subtotal - promoDiscount;
    const platformFee = subtotalAfterPromo * (ticketSettings.platform_fee_percentage / 100);
    const processingFee =
      subtotalAfterPromo * (ticketSettings.payment_processing_fee_percentage / 100) +
      (ticketSettings.payment_processing_fee_fixed * totalQuantity);

    const total = ticketSettings.fee_payer === 'buyer'
      ? subtotalAfterPromo + platformFee + processingFee
      : subtotalAfterPromo;

    return { subtotal, platformFee, processingFee, total, totalQuantity, promoDiscount };
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
      const { total, platformFee, processingFee, subtotal, promoDiscount } = calculateTotals();

      console.log('[TicketPurchase] Invoking function with:', {
        firstTicketId,
        quantity,
        eventId,
        total,
        platformFee,
        processingFee,
        subtotal,
        promoDiscount,
        promoCodeId: appliedPromo?.id
      });

      const functionName = paymentMethod === "pix"
        ? "create-mercadopago-checkout"
        : "create-ticket-checkout";

      console.log('[TicketPurchase] Using payment method:', paymentMethod, 'with function:', functionName);

      const response = await supabase.functions.invoke(functionName, {
        body: {
          ticketTypeId: firstTicketId,
          quantity,
          eventId,
          totalAmount: total,
          platformFee: platformFee,
          processingFee: processingFee,
          subtotal: subtotal,
          promoCodeId: appliedPromo?.id || null,
          promoDiscount: promoDiscount,
        },
      });

      console.log('[TicketPurchase] Full response:', response);
      console.log('[TicketPurchase] Response data:', response.data);
      console.log('[TicketPurchase] Response error:', response.error);

      if (response.error) {
        console.error('[TicketPurchase] Function error:', response.error);
        const errorMsg = response.error.message || JSON.stringify(response.error);

        if (errorMsg.includes('MERCADOPAGO_ACCESS_TOKEN')) {
          toast.error("Mercado Pago não configurado", {
            duration: 8000,
            description: "O sistema de pagamentos ainda não foi configurado. Entre em contato com o suporte."
          });
          return;
        }

        throw new Error(`Erro na função: ${errorMsg}`);
      }

      const data = response.data;

      if (!data) {
        throw new Error("Nenhum dado retornado da função");
      }

      if (data.error) {
        console.error('[TicketPurchase] Data contains error:', data.error);

        if (data.error.includes('MERCADOPAGO_ACCESS_TOKEN') || data.error.includes('Mercado Pago não configurado')) {
          toast.error("⚠️ Mercado Pago não configurado", {
            duration: 10000,
            description: "O Access Token do Mercado Pago precisa ser configurado. Vá em Supabase > Project Settings > Edge Functions > Secrets e adicione MERCADOPAGO_ACCESS_TOKEN com seu Access Token de produção do Mercado Pago."
          });
          return;
        }

        if (data.error.includes('QR Code PIX não foi gerado')) {
          toast.error("❌ Erro ao gerar QR Code PIX", {
            duration: 10000,
            description: "Sua conta do Mercado Pago pode não estar configurada para aceitar PIX. Verifique se o PIX está ativado na sua conta."
          });
          return;
        }

        if (data.error.includes('STRIPE_SECRET_KEY')) {
          toast.error("Pagamentos não configurados", {
            duration: 8000,
            description: data.error
          });
          return;
        }

        if (data.error.includes('ainda não configurou pagamentos')) {
          toast.error(data.error, {
            duration: 6000,
            description: "O organizador precisa conectar sua conta Stripe antes de vender ingressos."
          });
          return;
        }

        throw new Error(data.error);
      }

      if (paymentMethod === "pix" && data?.qrCode) {
        console.log('[TicketPurchase] PIX QR Code received');
        setPixData({
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64,
          paymentId: data.paymentId,
          expirationDate: data.expirationDate,
        });
        toast.success("QR Code PIX gerado!");
      } else if (data?.url) {
        console.log('[TicketPurchase] Redirecting to:', data.url);
        window.location.href = data.url;
        onOpenChange(false);
        toast.success("Redirecionando para o checkout...");
      } else {
        console.error('[TicketPurchase] No URL or QR code in response:', data);
        throw new Error("Dados de pagamento não recebidos");
      }
    } catch (error) {
      console.error("[TicketPurchase] Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("[TicketPurchase] Full error object:", JSON.stringify(error, null, 2));

      toast.error("Erro ao gerar QR Code PIX", {
        description: errorMessage,
        duration: 10000,
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setPixData(null);
      setSelectedTickets({});
      setAppliedPromo(null);
      setPromoCode("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {pixData ? "Pagar com PIX" : "Comprar Ingressos"}
          </DialogTitle>
          <p className="text-muted-foreground">{eventTitle}</p>
        </DialogHeader>

        {pixData ? (
          <div className="space-y-4">
            <MercadoPagoPayment
              qrCode={pixData.qrCode}
              qrCodeBase64={pixData.qrCodeBase64}
              expirationDate={pixData.expirationDate}
            />
            <Button
              onClick={() => handleDialogClose(false)}
              variant="outline"
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        ) : (
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

              {/* Promo Code */}
              <div className="space-y-2">
                <Label>Código Promocional</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    disabled={!!appliedPromo || loading}
                  />
                  {!appliedPromo ? (
                    <Button
                      onClick={applyPromoCode}
                      disabled={verifyingPromo || loading || !promoCode.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {verifyingPromo ? "Verificando..." : "Validar"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoCode("");
                      }}
                      variant="destructive"
                    >
                      Remover
                    </Button>
                  )}
                </div>
                {appliedPromo && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-green-700">
                          Código {appliedPromo.code} aplicado!
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {appliedPromo.discount_type === "percentage"
                            ? `Desconto de ${appliedPromo.discount_value}%`
                            : `Desconto de R$ ${appliedPromo.discount_value.toFixed(2)}`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-700">
                          - R$ {totals.promoDiscount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({totals.totalQuantity} ingresso{totals.totalQuantity > 1 ? 's' : ''})</span>
                  <span>R$ {totals.subtotal.toFixed(2)}</span>
                </div>

                {totals.promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-medium">Desconto Promocional</span>
                    <span>- R$ {totals.promoDiscount.toFixed(2)}</span>
                  </div>
                )}

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

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>Método de Pagamento</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`border-2 rounded-lg p-4 text-center transition-all ${
                      paymentMethod === "pix"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold mb-1">PIX</div>
                    <div className="text-xs text-muted-foreground">Pagamento instantâneo</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`border-2 rounded-lg p-4 text-center transition-all ${
                      paymentMethod === "card"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold mb-1">Cartão</div>
                    <div className="text-xs text-muted-foreground">Crédito ou Débito</div>
                  </button>
                </div>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
