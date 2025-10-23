import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  event_id: string;
  gross_amount: number;
  platform_fee: number;
  payment_gateway_fee: number;
  net_amount: number;
  transaction_status: string;
  payment_date: string | null;
  transfer_date: string | null;
  transfer_scheduled_date: string | null;
  created_at: string;
  events: {
    title: string;
    slug: string;
  };
}

interface SalesStats {
  total_gross: number;
  total_fees: number;
  total_net: number;
  pending_amount: number;
  completed_amount: number;
  transaction_count: number;
}

interface TicketSalesOverviewProps {
  organizerId: string;
}

export default function TicketSalesOverview({ organizerId }: TicketSalesOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    total_gross: 0,
    total_fees: 0,
    total_net: 0,
    pending_amount: 0,
    completed_amount: 0,
    transaction_count: 0,
  });

  useEffect(() => {
    loadTransactions();
  }, [organizerId]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data: transactionsData, error } = await supabase
        .from('ticket_sales_transactions')
        .select(`
          *,
          events (
            title,
            slug
          )
        `)
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(transactionsData || []);

      const calculatedStats: SalesStats = {
        total_gross: 0,
        total_fees: 0,
        total_net: 0,
        pending_amount: 0,
        completed_amount: 0,
        transaction_count: transactionsData?.length || 0,
      };

      transactionsData?.forEach((transaction) => {
        calculatedStats.total_gross += Number(transaction.gross_amount);
        calculatedStats.total_fees += Number(transaction.platform_fee) + Number(transaction.payment_gateway_fee);
        calculatedStats.total_net += Number(transaction.net_amount);

        if (transaction.transaction_status === 'completed') {
          calculatedStats.completed_amount += Number(transaction.net_amount);
        } else if (transaction.transaction_status === 'pending' || transaction.transaction_status === 'processing') {
          calculatedStats.pending_amount += Number(transaction.net_amount);
        }
      });

      setStats(calculatedStats);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Recebido</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Processando</Badge>;
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Falhou</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Reembolsado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const exportTransactions = () => {
    const csv = [
      ['Data', 'Evento', 'Valor Bruto', 'Taxas', 'Valor Líquido', 'Status', 'Data Pagamento', 'Data Repasse'].join(','),
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString('pt-BR'),
        t.events?.title || 'N/A',
        t.gross_amount,
        (Number(t.platform_fee) + Number(t.payment_gateway_fee)).toFixed(2),
        t.net_amount,
        t.transaction_status,
        t.payment_date ? new Date(t.payment_date).toLocaleDateString('pt-BR') : 'N/A',
        t.transfer_date ? new Date(t.transfer_date).toLocaleDateString('pt-BR') : 'N/A',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando vendas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Brutas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_gross)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.transaction_count} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Taxas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_fees)}</div>
            <p className="text-xs text-muted-foreground">
              Plataforma + Gateway
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pending_amount)}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando repasse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.completed_amount)}</div>
            <p className="text-xs text-muted-foreground">
              Total transferido
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Todas as vendas de ingressos e seus respectivos repasses
              </CardDescription>
            </div>
            {transactions.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportTransactions}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium">{transaction.events?.title || 'Evento'}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                    {getStatusBadge(transaction.transaction_status)}
                  </div>

                  <Separator className="my-2" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Valor Bruto</div>
                      <div className="font-medium">{formatCurrency(Number(transaction.gross_amount))}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Taxas</div>
                      <div className="font-medium text-red-600">
                        -{formatCurrency(Number(transaction.platform_fee) + Number(transaction.payment_gateway_fee))}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Valor Líquido</div>
                      <div className="font-medium text-green-600">
                        {formatCurrency(Number(transaction.net_amount))}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        {transaction.transfer_date ? 'Recebido em' : 'Previsão'}
                      </div>
                      <div className="font-medium">
                        {transaction.transfer_date
                          ? new Date(transaction.transfer_date).toLocaleDateString('pt-BR')
                          : transaction.transfer_scheduled_date
                          ? new Date(transaction.transfer_scheduled_date).toLocaleDateString('pt-BR')
                          : 'A definir'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
