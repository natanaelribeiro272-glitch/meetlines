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
      // Fetch all ticket sales with event and organizer info
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
          created_at,
          events!inner (
            id,
            title,
            end_date,
            status,
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

      console.log("Sales data:", salesData);

      // Group sales by organizer
      const organizerMap = new Map<string, {
        id: string;
        page_title: string;
        avatar_url: string | null;
        total_sales: number;
        total_gross_amount: number;
        total_pending_amount: number;
        pending_payouts_count: number;
        next_payout_date: string | null;
        events: Set<string>;
      }>();

      for (const sale of salesData || []) {
        const event = sale.events as any;
        const organizer = event?.organizers;
        
        if (!organizer) continue;

        const organizerId = organizer.id;
        
        if (!organizerMap.has(organizerId)) {
          organizerMap.set(organizerId, {
            id: organizerId,
            page_title: organizer.page_title,
            avatar_url: organizer.avatar_url,
            total_sales: 0,
            total_gross_amount: 0,
            total_pending_amount: 0,
            pending_payouts_count: 0,
            next_payout_date: null,
            events: new Set(),
          });
        }

        const orgData = organizerMap.get(organizerId)!;
        orgData.total_sales++;
        orgData.total_gross_amount += Number(sale.total_amount);
        
        // Add event to set
        orgData.events.add(event.id);

        // Check if payout already exists for this event
        const { data: existingPayout } = await supabase
          .from("organizer_payouts")
          .select("payout_status")
          .eq("event_id", event.id)
          .maybeSingle();

        // Calculate net amount for pending payouts
        if (!existingPayout || existingPayout.payout_status === "pending") {
          const grossAmount = Number(sale.total_amount);
          const platformFee = Number(sale.platform_fee || grossAmount * 0.05);
          const processingFee = Number(sale.payment_processing_fee || (grossAmount * 0.0399 + 0.39));
          const netAmount = grossAmount - platformFee - processingFee;

          orgData.total_pending_amount += netAmount;

          // Calculate payout date if event has ended
          if (event.end_date) {
            const eventEndDate = new Date(event.end_date);
            const now = new Date();
            
            if (eventEndDate < now) {
              const payoutDate = calculatePayoutDate(eventEndDate);
              if (!orgData.next_payout_date || payoutDate < orgData.next_payout_date) {
                orgData.next_payout_date = payoutDate;
              }
            }
          }
        }
      }

      // Count unique events with pending payouts per organizer
      for (const [organizerId, orgData] of organizerMap.entries()) {
        orgData.pending_payouts_count = orgData.events.size;
      }

      const organizersList = Array.from(organizerMap.values())
        .filter(org => org.total_sales > 0)
        .map(org => ({
          id: org.id,
          page_title: org.page_title,
          avatar_url: org.avatar_url,
          total_pending_amount: org.total_pending_amount,
          pending_payouts_count: org.pending_payouts_count,
          next_payout_date: org.next_payout_date,
        }));

      console.log("Organizers with sales:", organizersList);
      setOrganizers(organizersList);
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
