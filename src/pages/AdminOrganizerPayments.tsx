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

interface OrganizerWithSales {
  id: string;
  page_title: string;
  avatar_url: string | null;
  total_pending_amount: number;
  pending_payouts_count: number;
  next_payout_date: string | null;
}

export default function AdminOrganizerPayments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizers, setOrganizers] = useState<OrganizerWithSales[]>([]);

  useEffect(() => {
    fetchOrganizersWithSales();
  }, []);

  const fetchOrganizersWithSales = async () => {
    try {
      // Fetch all organizers with events that have ticket sales
      const { data: organizersData, error: orgError } = await supabase
        .from("organizers")
        .select(`
          id,
          page_title,
          avatar_url
        `);

      if (orgError) throw orgError;

      // For each organizer, calculate pending payouts
      const organizersWithSales = await Promise.all(
        organizersData.map(async (org) => {
          // Get events with completed sales
          const { data: events } = await supabase
            .from("events")
            .select("id, end_date, status")
            .eq("organizer_id", org.id);

          if (!events || events.length === 0) return null;

          let totalPending = 0;
          let pendingCount = 0;
          let nextPayoutDate: string | null = null;

          for (const event of events) {
            // Get sales for this event
            const { data: sales } = await supabase
              .from("ticket_sales")
              .select("total_amount, platform_fee, payment_processing_fee, payment_status")
              .eq("event_id", event.id)
              .eq("payment_status", "completed");

            if (sales && sales.length > 0) {
              // Check if payout already exists
              const { data: existingPayout } = await supabase
                .from("organizer_payouts")
                .select("payout_status")
                .eq("event_id", event.id)
                .single();

              if (!existingPayout || existingPayout.payout_status === "pending") {
                const grossAmount = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
                const platformFee = grossAmount * 0.05;
                const processingFee = (grossAmount * 0.0399) + (sales.length * 0.39);
                const netAmount = grossAmount - platformFee - processingFee;

                totalPending += netAmount;
                pendingCount++;

                // Calculate payout date (3 business days after event end)
                if (event.end_date) {
                  const payoutDate = calculatePayoutDate(new Date(event.end_date));
                  if (!nextPayoutDate || payoutDate < nextPayoutDate) {
                    nextPayoutDate = payoutDate;
                  }
                }
              }
            }
          }

          if (pendingCount === 0) return null;

          return {
            ...org,
            total_pending_amount: totalPending,
            pending_payouts_count: pendingCount,
            next_payout_date: nextPayoutDate,
          };
        })
      );

      setOrganizers(organizersWithSales.filter(Boolean) as OrganizerWithSales[]);
    } catch (error) {
      console.error("Error fetching organizers:", error);
      toast.error("Erro ao carregar organizadores");
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
              <CardTitle className="text-sm font-medium">Total Organizadores</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizers.length}</div>
              <p className="text-xs text-muted-foreground">com vendas pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {organizers.reduce((sum, o) => sum + o.total_pending_amount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">a repassar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Pendentes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {organizers.reduce((sum, o) => sum + o.pending_payouts_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">eventos para processar</p>
            </CardContent>
          </Card>
        </div>

        {/* Organizers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Organizadores com Repasses Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {organizers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum repasse pendente</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organizador</TableHead>
                      <TableHead className="text-center">Eventos</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Próximo Repasse</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizers.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {org.avatar_url ? (
                              <img
                                src={org.avatar_url}
                                alt={org.page_title}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="font-medium">{org.page_title}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{org.pending_payouts_count}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          R$ {org.total_pending_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {org.next_payout_date && (
                            <span className="text-sm">
                              {new Date(org.next_payout_date).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/admin/organizer-payments/${org.id}`)}
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
