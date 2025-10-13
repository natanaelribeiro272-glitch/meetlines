import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, DollarSign, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface EventWithPayout {
  event_id: string;
  event_title: string;
  event_end_date: string | null;
  organizer_id: string;
  organizer_name: string;
  organizer_avatar: string | null;
  total_sales: number;
  gross_amount: number;
  platform_fee: number;
  processing_fee: number;
  net_amount: number;
  has_payout: boolean;
  payout_status: string | null;
  payout_date: string | null;
}

export default function AdminOrganizerPayments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWithPayout[]>([]);

  useEffect(() => {
    fetchEventsWithSales();
  }, []);

  const fetchEventsWithSales = async () => {
    try {
      const { data: salesData, error: salesError } = await supabase
        .from("ticket_sales")
        .select(`
          id,
          event_id,
          total_amount,
          subtotal,
          platform_fee,
          payment_processing_fee,
          payment_status,
          events!inner (
            id,
            title,
            end_date,
            organizer_id,
            organizers!inner (
              id,
              page_title,
              avatar_url
            )
          )
        `)
        .eq("payment_status", "completed");

      if (salesError) throw salesError;

      // Group by event
      const eventMap = new Map<string, {
        event_id: string;
        event_title: string;
        event_end_date: string | null;
        organizer_id: string;
        organizer_name: string;
        organizer_avatar: string | null;
        sales: any[];
        gross_amount: number;
      }>();

      for (const sale of salesData || []) {
        const event = sale.events as any;
        const organizer = event?.organizers;
        
        if (!event || !organizer) continue;

        if (!eventMap.has(event.id)) {
          eventMap.set(event.id, {
            event_id: event.id,
            event_title: event.title,
            event_end_date: event.end_date,
            organizer_id: organizer.id,
            organizer_name: organizer.page_title,
            organizer_avatar: organizer.avatar_url,
            sales: [],
            gross_amount: 0,
          });
        }

        const eventData = eventMap.get(event.id)!;
        eventData.sales.push(sale);
        eventData.gross_amount += Number(sale.total_amount);
      }

      // Get payout info for each event
      const eventsList: EventWithPayout[] = [];
      
      for (const [eventId, eventData] of eventMap.entries()) {
        const { data: payout } = await supabase
          .from("organizer_payouts")
          .select("*")
          .eq("event_id", eventId)
          .maybeSingle();

        const grossAmount = eventData.gross_amount;
        const platformFee = payout?.platform_fee || grossAmount * 0.05;
        const processingFee = payout?.processing_fee || (grossAmount * 0.0399 + 0.39);
        const netAmount = grossAmount - platformFee - processingFee;

        eventsList.push({
          event_id: eventData.event_id,
          event_title: eventData.event_title,
          event_end_date: eventData.event_end_date,
          organizer_id: eventData.organizer_id,
          organizer_name: eventData.organizer_name,
          organizer_avatar: eventData.organizer_avatar,
          total_sales: eventData.sales.length,
          gross_amount: grossAmount,
          platform_fee: platformFee,
          processing_fee: processingFee,
          net_amount: netAmount,
          has_payout: !!payout,
          payout_status: payout?.payout_status || null,
          payout_date: payout?.payout_date || null,
        });
      }

      setEvents(eventsList);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  };

  const calculatePayoutDate = (endDate: Date): string => {
    const date = new Date(endDate);
    let businessDaysAdded = 0;

    while (businessDaysAdded < 3) {
      date.setDate(date.getDate() + 1);
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        businessDaysAdded++;
      }
    }

    return date.toISOString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Repasses de Organizadores</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie pagamentos dos organizadores
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto pb-20">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">com vendas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bruto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {events.reduce((sum, e) => sum + e.gross_amount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">em vendas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Líquido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {events.reduce((sum, e) => sum + e.net_amount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">a repassar</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos com Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum evento com vendas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Organizador</TableHead>
                      <TableHead className="text-center">Vendas</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.event_id}>
                        <TableCell>
                          <div className="font-medium">{event.event_title}</div>
                          {event.event_end_date && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.event_end_date).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {event.organizer_avatar ? (
                              <img
                                src={event.organizer_avatar}
                                alt={event.organizer_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <span className="text-sm">{event.organizer_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{event.total_sales}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {event.gross_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          R$ {event.net_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {event.has_payout ? (
                            <Badge variant={event.payout_status === "completed" ? "default" : "secondary"}>
                              {event.payout_status === "completed" ? "Pago" : "Pendente"}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Sem repasse</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/admin/organizer-payments/${event.organizer_id}?event=${event.event_id}`)}
                          >
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
