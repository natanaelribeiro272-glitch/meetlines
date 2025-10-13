import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Building2, Calendar, DollarSign, Check } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface OrganizerDetails {
  id: string;
  page_title: string;
  avatar_url: string | null;
  user_id: string;
}

interface EventPayout {
  event_id: string;
  event_title: string;
  event_end_date: string;
  gross_amount: number;
  platform_fee: number;
  processing_fee: number;
  net_amount: number;
  payout_due_date: string;
  payout_status: string;
  payout_id: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_agency: string | null;
  bank_account_holder: string | null;
  bank_document: string | null;
  bank_account_type: string | null;
  pix_key: string | null;
}

export default function AdminOrganizerPaymentDetails() {
  const { organizerId } = useParams<{ organizerId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizer, setOrganizer] = useState<OrganizerDetails | null>(null);
  const [payouts, setPayouts] = useState<EventPayout[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    payoutId: string | null;
    eventId: string;
  }>({ open: false, payoutId: null, eventId: "" });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchOrganizerDetails();
  }, [organizerId]);

  const fetchOrganizerDetails = async () => {
    if (!organizerId) return;

    try {
      // Fetch organizer info
      const { data: orgData, error: orgError } = await supabase
        .from("organizers")
        .select("id, page_title, avatar_url, user_id")
        .eq("id", organizerId)
        .single();

      if (orgError) throw orgError;
      setOrganizer(orgData);

      // Fetch events with sales
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", organizerId);

      if (eventsError) throw eventsError;

      const payoutsList: EventPayout[] = [];

      for (const event of events || []) {
        // Get sales for this event
        const { data: sales } = await supabase
          .from("ticket_sales")
          .select("*")
          .eq("event_id", event.id)
          .eq("payment_status", "completed");

        if (sales && sales.length > 0) {
          const grossAmount = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
          const platformFee = grossAmount * 0.05;
          const processingFee = (grossAmount * 0.0399) + (sales.length * 0.39);
          const netAmount = grossAmount - platformFee - processingFee;

          // Check if payout exists
          const { data: existingPayout } = await supabase
            .from("organizer_payouts")
            .select("*")
            .eq("event_id", event.id)
            .maybeSingle();

          const payoutDueDate = calculatePayoutDate(new Date(event.end_date));

          payoutsList.push({
            event_id: event.id,
            event_title: event.title,
            event_end_date: event.end_date,
            gross_amount: grossAmount,
            platform_fee: platformFee,
            processing_fee: processingFee,
            net_amount: netAmount,
            payout_due_date: payoutDueDate,
            payout_status: existingPayout?.payout_status || "pending",
            payout_id: existingPayout?.id || null,
            bank_name: event.bank_name,
            bank_account: event.bank_account,
            bank_agency: event.bank_agency,
            bank_account_holder: event.bank_account_holder,
            bank_document: event.bank_document,
            bank_account_type: event.bank_account_type,
            pix_key: event.pix_key,
          });
        }
      }

      setPayouts(payoutsList);
    } catch (error) {
      console.error("Error fetching organizer details:", error);
      toast.error("Erro ao carregar detalhes");
    } finally {
      setLoading(false);
    }
  };

  const calculatePayoutDate = (endDate: Date): string => {
    const date = new Date(endDate);
    let businessDaysAdded = 0;

    while (businessDaysAdded < 3) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        businessDaysAdded++;
      }
    }

    return date.toISOString();
  };

  const handleMarkAsPaid = async () => {
    if (!confirmDialog.payoutId && !confirmDialog.eventId) return;

    try {
      const payout = payouts.find((p) => p.event_id === confirmDialog.eventId);
      if (!payout) return;

      if (confirmDialog.payoutId) {
        // Update existing payout
        const { error } = await supabase
          .from("organizer_payouts")
          .update({
            payout_status: "completed",
            payout_date: new Date().toISOString(),
            payout_notes: notes,
          })
          .eq("id", confirmDialog.payoutId);

        if (error) throw error;
      } else {
        // Create new payout record
        const { error } = await supabase.from("organizer_payouts").insert({
          event_id: payout.event_id,
          organizer_id: organizerId,
          gross_amount: payout.gross_amount,
          platform_fee: payout.platform_fee,
          processing_fee: payout.processing_fee,
          net_amount: payout.net_amount,
          payout_due_date: payout.payout_due_date,
          payout_status: "completed",
          payout_date: new Date().toISOString(),
          payout_notes: notes,
        });

        if (error) throw error;
      }

      toast.success("Repasse marcado como pago!");
      setConfirmDialog({ open: false, payoutId: null, eventId: "" });
      setNotes("");
      fetchOrganizerDetails();
    } catch (error) {
      console.error("Error marking payout as paid:", error);
      toast.error("Erro ao marcar repasse como pago");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Pago</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Organizador não encontrado</p>
      </div>
    );
  }

  const totalPending = payouts
    .filter((p) => p.payout_status === "pending")
    .reduce((sum, p) => sum + p.net_amount, 0);

  const totalPaid = payouts
    .filter((p) => p.payout_status === "completed")
    .reduce((sum, p) => sum + p.net_amount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/organizer-payments")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              {organizer.avatar_url ? (
                <img
                  src={organizer.avatar_url}
                  alt={organizer.page_title}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {organizer.page_title}
                </h1>
                <p className="text-sm text-muted-foreground">Detalhes de repasses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto pb-20">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">R$ {totalPending.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {payouts.filter((p) => p.payout_status === "pending").length} eventos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {payouts.filter((p) => p.payout_status === "completed").length} eventos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payouts.length}</div>
              <p className="text-xs text-muted-foreground">com vendas</p>
            </CardContent>
          </Card>
        </div>

        {/* Payouts Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Repasses por Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Fim do Evento</TableHead>
                    <TableHead className="text-right">Receita Bruta</TableHead>
                    <TableHead className="text-right">Taxa Plataforma</TableHead>
                    <TableHead className="text-right">Taxa Stripe</TableHead>
                    <TableHead className="text-right">Valor Líquido</TableHead>
                    <TableHead>Data Repasse</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.event_id}>
                      <TableCell className="font-medium">{payout.event_title}</TableCell>
                      <TableCell>
                        {format(new Date(payout.event_end_date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {payout.gross_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -R$ {payout.platform_fee.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -R$ {payout.processing_fee.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        R$ {payout.net_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(payout.payout_due_date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(payout.payout_status)}
                      </TableCell>
                      <TableCell className="text-center">
                        {payout.payout_status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                payoutId: payout.payout_id,
                                eventId: payout.event_id,
                              })
                            }
                          >
                            Marcar como Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        {payouts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Dados para Repasse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payouts[0].pix_key && (
                <div>
                  <h3 className="font-semibold mb-2">Chave PIX</h3>
                  <p className="text-sm bg-muted p-3 rounded">{payouts[0].pix_key}</p>
                </div>
              )}

              {payouts[0].bank_name && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Dados Bancários</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Banco:</span>
                        <p className="font-medium">{payouts[0].bank_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tipo de Conta:</span>
                        <p className="font-medium">{payouts[0].bank_account_type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Agência:</span>
                        <p className="font-medium">{payouts[0].bank_agency}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conta:</span>
                        <p className="font-medium">{payouts[0].bank_account}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Titular:</span>
                        <p className="font-medium">{payouts[0].bank_account_holder}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CPF/CNPJ:</span>
                        <p className="font-medium">{payouts[0].bank_document}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, payoutId: null, eventId: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Repasse</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja marcar este repasse como pago? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Observações (opcional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione informações sobre o pagamento..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, payoutId: null, eventId: "" })}
            >
              Cancelar
            </Button>
            <Button onClick={handleMarkAsPaid}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
