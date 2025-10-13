import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Ticket, CheckCircle, Loader2, MapPin, QrCode } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";

interface EventRegistration {
  id: string;
  event_id: string;
  attendance_confirmed: boolean;
  created_at: string;
  event: {
    id: string;
    title: string;
    event_date: string;
    location: string;
    image_url: string | null;
    organizer: {
      page_title: string;
    };
  };
}

interface TicketPurchase {
  id: string;
  event_id: string;
  quantity: number;
  total_amount: number;
  payment_status: string;
  created_at: string;
  event: {
    id: string;
    title: string;
    event_date: string;
    location: string;
    image_url: string | null;
    organizer: {
      page_title: string;
    };
  };
  ticket_type: {
    name: string;
  };
}

export default function UserEvents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [purchases, setPurchases] = useState<TicketPurchase[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketPurchase | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserEvents();
    }
  }, [user]);

  const fetchUserEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar cadastros em eventos
      const { data: registrationsData, error: regError } = await supabase
        .from("event_registrations")
        .select(`
          id,
          event_id,
          attendance_confirmed,
          created_at,
          events!inner (
            id,
            title,
            event_date,
            location,
            image_url,
            organizers!inner (
              page_title
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (regError) throw regError;

      // Buscar ingressos comprados
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("ticket_sales")
        .select(`
          id,
          event_id,
          quantity,
          total_amount,
          payment_status,
          created_at,
          ticket_type_id,
          ticket_types!inner (
            name
          ),
          events!inner (
            id,
            title,
            event_date,
            location,
            image_url,
            organizers!inner (
              page_title
            )
          )
        `)
        .eq("user_id", user.id)
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false });

      if (purchasesError) throw purchasesError;

      setRegistrations(
        (registrationsData || []).map((reg: any) => ({
          ...reg,
          event: {
            ...reg.events,
            organizer: reg.events.organizers,
          },
        }))
      );

      setPurchases(
        (purchasesData || []).map((purchase: any) => ({
          ...purchase,
          event: {
            ...purchase.events,
            organizer: purchase.events.organizers,
          },
          ticket_type: purchase.ticket_types,
        }))
      );
    } catch (error) {
      console.error("Error fetching user events:", error);
      toast.error("Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  };

  const confirmedEvents = registrations.filter((r) => r.attendance_confirmed);
  const unconfirmedEvents = registrations.filter((r) => !r.attendance_confirmed);

  const EventCard = ({ event, type, registration, purchase }: any) => (
    <Card
      className={type === "purchase" ? "" : "cursor-pointer hover:shadow-lg transition-shadow"}
      onClick={type === "purchase" ? undefined : () => navigate(`/events/${event.id}`)}
    >
      <div className="flex gap-4 p-4">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-24 h-24 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {event.organizer.page_title}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(event.event_date), "PPP 'às' HH:mm", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          {type === "purchase" && purchase && (
            <div className="mt-3 flex items-center justify-between">
              <div>
                <Badge variant="secondary">{purchase.ticket_type.name}</Badge>
                <span className="ml-2 text-sm text-muted-foreground">
                  {purchase.quantity}x - R$ {purchase.total_amount.toFixed(2)}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => setSelectedTicket(purchase)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Ver Ingresso
              </Button>
            </div>
          )}
          {type === "confirmed" && (
            <Badge className="mt-2 bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Presença Confirmada
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );

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
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Meus Eventos</h1>
              <p className="text-sm text-muted-foreground">
                Cadastros, confirmações e ingressos
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto pb-20">
        <Tabs defaultValue="purchases" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="purchases">
              <Ticket className="h-4 w-4 mr-2" />
              Ingressos ({purchases.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmados ({confirmedEvents.length})
            </TabsTrigger>
            <TabsTrigger value="registrations">
              <Calendar className="h-4 w-4 mr-2" />
              Cadastros ({unconfirmedEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="space-y-4 mt-6">
            {purchases.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Você ainda não comprou nenhum ingresso
                  </p>
                </CardContent>
              </Card>
            ) : (
              purchases.map((purchase) => (
                <EventCard
                  key={purchase.id}
                  event={purchase.event}
                  type="purchase"
                  purchase={purchase}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4 mt-6">
            {confirmedEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Você ainda não confirmou presença em nenhum evento
                  </p>
                </CardContent>
              </Card>
            ) : (
              confirmedEvents.map((registration) => (
                <EventCard
                  key={registration.id}
                  event={registration.event}
                  type="confirmed"
                  registration={registration}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="registrations" className="space-y-4 mt-6">
            {unconfirmedEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Você não tem cadastros pendentes em eventos
                  </p>
                </CardContent>
              </Card>
            ) : (
              unconfirmedEvents.map((registration) => (
                <EventCard
                  key={registration.id}
                  event={registration.event}
                  type="registration"
                  registration={registration}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Ticket Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Seu Ingresso Digital</DialogTitle>
            <DialogDescription>
              Apresente este QR Code na entrada do evento
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6 py-4">
              {/* Event Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Evento</p>
                  <p className="font-semibold text-lg">{selectedTicket.event.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Organizador</p>
                  <p className="font-medium">{selectedTicket.event.organizer.page_title}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {format(new Date(selectedTicket.event.event_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">
                      {format(new Date(selectedTicket.event.event_date), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="font-medium">{selectedTicket.event.location}</p>
                </div>
              </div>

              <div className="border-t border-dashed pt-4" />

              {/* Ticket Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Ingresso</p>
                    <p className="font-semibold">{selectedTicket.ticket_type.name}</p>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    {selectedTicket.quantity}x
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-bold text-xl text-primary">
                    R$ {selectedTicket.total_amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data da Compra</p>
                  <p className="font-medium">
                    {format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="border-t border-dashed pt-4" />

              {/* QR Code */}
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-6 rounded-lg shadow-inner">
                  <QRCode value={selectedTicket.id} size={220} />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Código do Ingresso</p>
                  <p className="text-xs font-mono bg-muted px-3 py-1 rounded">
                    {selectedTicket.id}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      const canvas = document.querySelector('canvas');
                      if (canvas) {
                        const url = canvas.toDataURL();
                        const link = document.createElement('a');
                        link.download = `ingresso-${selectedTicket.id.slice(0, 8)}.png`;
                        link.href = url;
                        link.click();
                        toast.success("QR Code baixado!");
                      }
                    }}
                  >
                    Baixar QR Code
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => navigate(`/events/${selectedTicket.event_id}`)}
                  >
                    Ver Evento
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
