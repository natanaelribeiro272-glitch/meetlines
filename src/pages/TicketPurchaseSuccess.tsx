import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Calendar, MapPin, Ticket } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCode from "react-qr-code";
import { toast } from "sonner";

interface TicketSaleDetails {
  id: string;
  quantity: number;
  total_amount: number;
  buyer_name: string;
  event: {
    title: string;
    event_date: string;
    location: string;
    image_url: string | null;
  };
  ticket_type: {
    name: string;
  };
}

export default function TicketPurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState<TicketSaleDetails | null>(null);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const fetchTicketDetails = async () => {
      if (!sessionId) {
        toast.error("ID da sessão não encontrado");
        navigate("/");
        return;
      }

      try {
        // More robust retry logic to handle possible delays
        let retries = 5;
        let baseSale: any = null;
        
        while (retries > 0 && !baseSale) {
          const { data: saleData, error } = await supabase
            .from("ticket_sales")
            .select(`
              id,
              quantity,
              total_amount,
              buyer_name,
              payment_status,
              event_id,
              ticket_type_id
            `)
            .eq("stripe_checkout_session_id", sessionId)
            .maybeSingle();

          if (saleData) {
            baseSale = saleData;
            break;
          }

          if (error && (error as any).code !== 'PGRST116') {
            throw error;
          }

          // Wait before retry (exponential backoff)
          if (retries > 1) {
            const backoffMs = (6 - retries) * 400 + 600; // 600ms, 1000ms, 1400ms, ...
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
          retries--;
        }

        if (!baseSale) {
          throw new Error("Ingresso não encontrado");
        }

        // Fetch related data separately to avoid PostgREST embedding issues when FKs are missing
        const [eventRes, ticketTypeRes] = await Promise.all([
          supabase
            .from("events")
            .select("title, event_date, location, image_url")
            .eq("id", baseSale.event_id)
            .single(),
          supabase
            .from("ticket_types")
            .select("name, is_active")
            .eq("id", baseSale.ticket_type_id)
            .maybeSingle(),
        ]);

        const fullData: TicketSaleDetails = {
          id: baseSale.id,
          quantity: baseSale.quantity,
          total_amount: baseSale.total_amount,
          buyer_name: baseSale.buyer_name,
          event: {
            title: eventRes.data?.title ?? "Ingresso",
            event_date: eventRes.data?.event_date ?? new Date().toISOString(),
            location: eventRes.data?.location ?? "",
            image_url: eventRes.data?.image_url ?? null,
          },
          ticket_type: {
            name: ticketTypeRes.data?.name ?? "Ingresso",
          },
        };

        setTicketData(fullData);
        
        // Update payment status to completed only if still pending
        if (baseSale.payment_status === "pending") {
          await supabase
            .from("ticket_sales")
            .update({ 
              payment_status: "completed",
              paid_at: new Date().toISOString()
            })
            .eq("id", baseSale.id);
        }

      } catch (error) {
        console.error("Error fetching ticket details:", error);
        toast.error("Erro ao carregar detalhes do ingresso");
        setTimeout(() => navigate("/"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticketData) {
    return null;
  }

  const qrCodeValue = JSON.stringify({
    ticketId: ticketData.id,
    eventTitle: ticketData.event.title,
    buyerName: ticketData.buyer_name,
    quantity: ticketData.quantity,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Compra Finalizada com Sucesso!
          </h1>
          <p className="text-muted-foreground">
            Seu ingresso foi confirmado. Guarde o QR Code abaixo para apresentar no evento.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Detalhes do Ingresso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* QR Code */}
            <div className="flex justify-center p-6 bg-white rounded-lg">
              <QRCode value={qrCodeValue} size={200} />
            </div>

            {/* Event Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {ticketData.event.title}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(ticketData.event.event_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{ticketData.event.location}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo de Ingresso:</span>
                  <span className="font-medium">{ticketData.ticket_type.name}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Quantidade:</span>
                  <span className="font-medium">{ticketData.quantity}x</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Comprador:</span>
                  <span className="font-medium">{ticketData.buyer_name}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t">
                  <span>Total Pago:</span>
                  <span className="text-primary">
                    R$ {ticketData.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="w-full"
              >
                Imprimir Ingresso
              </Button>
              <Button
                onClick={() => navigate("/")}
                className="w-full"
              >
                Voltar para Home
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Este QR Code é único e intransferível.</p>
          <p>Guarde-o com segurança para apresentar no dia do evento.</p>
        </div>
      </div>
    </div>
  );
}
