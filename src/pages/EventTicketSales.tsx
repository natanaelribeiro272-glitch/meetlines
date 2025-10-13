import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, DollarSign, Users, Ticket, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

interface TicketSale {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: string;
  created_at: string;
  paid_at: string | null;
  ticket_type: {
    name: string;
  };
}

interface EventDetails {
  title: string;
  event_date: string;
}

export default function EventTicketSales() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<TicketSale[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalTickets: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;

      try {
        // Fetch event details
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("title, event_date")
          .eq("id", eventId)
          .single();

        if (eventError) throw eventError;
        setEventDetails(event);

        // Fetch ticket sales
        const { data: salesData, error: salesError } = await supabase
          .from("ticket_sales")
          .select(`
            id,
            buyer_name,
            buyer_email,
            buyer_phone,
            quantity,
            unit_price,
            total_amount,
            payment_status,
            created_at,
            paid_at,
            ticket_type:ticket_types(name)
          `)
          .eq("event_id", eventId)
          .order("created_at", { ascending: false });

        if (salesError) throw salesError;

        setSales(salesData || []);

        // Calculate stats
        const completedSales = salesData?.filter((s) => s.payment_status === "completed") || [];
        setStats({
          totalSales: completedSales.length,
          totalRevenue: completedSales.reduce((acc, s) => acc + Number(s.total_amount), 0),
          totalTickets: completedSales.reduce((acc, s) => acc + s.quantity, 0),
        });
      } catch (error) {
        console.error("Error fetching sales data:", error);
        toast.error("Erro ao carregar dados de vendas");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Pago</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = ["Data", "Comprador", "Email", "Telefone", "Tipo", "Quantidade", "Total", "Status"];
    const rows = sales.map((sale) => [
      format(new Date(sale.created_at), "dd/MM/yyyy HH:mm"),
      sale.buyer_name,
      sale.buyer_email,
      sale.buyer_phone || "-",
      sale.ticket_type.name,
      sale.quantity,
      `R$ ${sale.total_amount.toFixed(2)}`,
      sale.payment_status === "completed" ? "Pago" : sale.payment_status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vendas_${eventId}_${Date.now()}.csv`;
    link.click();
    toast.success("Relatório exportado com sucesso!");
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
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 ml-4">
            <h1 className="text-lg font-semibold text-foreground">Vendas de Ingressos</h1>
            {eventDetails && (
              <p className="text-sm text-muted-foreground">{eventDetails.title}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto pb-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
              <p className="text-xs text-muted-foreground">vendas confirmadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">em vendas confirmadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingressos Vendidos</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTickets}</div>
              <p className="text-xs text-muted-foreground">ingressos no total</p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma venda registrada ainda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Comprador</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(sale.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{sale.buyer_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-muted-foreground">{sale.buyer_email}</div>
                            {sale.buyer_phone && (
                              <div className="text-muted-foreground">{sale.buyer_phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{sale.ticket_type.name}</TableCell>
                        <TableCell className="text-center">{sale.quantity}x</TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {sale.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(sale.payment_status)}
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
