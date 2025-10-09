import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClaimRequest {
  id: string;
  status: string;
  message: string;
  created_at: string;
  platform_events: {
    id: string;
    title: string;
    organizer_name: string;
    event_date: string;
  };
  organizers: {
    id: string;
    username: string;
    page_title: string;
    avatar_url: string;
  };
}

export default function AdminClaimRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [requests, setRequests] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchRequests();
  }, [isAdmin, navigate]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('event_claim_requests')
        .select(`
          *,
          platform_events (id, title, organizer_name, event_date),
          organizers (id, username, page_title, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, platformEventId: string, organizerId: string) => {
    if (!user) return;

    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('event_claim_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by_admin_id: user.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update platform event with organizer
      const { error: eventError } = await supabase
        .from('platform_events')
        .update({ claimed_by_organizer_id: organizerId })
        .eq('id', platformEventId);

      if (eventError) throw eventError;

      toast.success('Solicitação aprovada!');
      fetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error('Erro ao aprovar: ' + error.message);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_claim_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by_admin_id: user.id
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitação rejeitada');
      fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error('Erro ao rejeitar: ' + error.message);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Solicitações de Associação</h1>
        <p className="text-muted-foreground">Gerencie pedidos de organizadores para eventos da plataforma</p>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma solicitação encontrada
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{request.platform_events.title}</CardTitle>
                    <CardDescription>
                      Solicitado em {format(new Date(request.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    request.status === 'pending' ? 'default' :
                    request.status === 'approved' ? 'secondary' : 'destructive'
                  }>
                    {request.status === 'pending' ? 'Pendente' :
                     request.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Evento</p>
                    <p className="font-medium">{request.platform_events.title}</p>
                    <p className="text-sm">{format(new Date(request.platform_events.event_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Organizador Solicitante</p>
                    <div className="flex items-center gap-2">
                      {request.organizers.avatar_url && (
                        <img src={request.organizers.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      )}
                      <div>
                        <p className="font-medium">{request.organizers.page_title}</p>
                        <p className="text-sm text-muted-foreground">@{request.organizers.username}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {request.message && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Mensagem</p>
                    <p className="text-sm bg-muted p-3 rounded">{request.message}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/@${request.organizers.username}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Perfil
                  </Button>
                  
                  {request.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id, request.platform_events.id, request.organizers.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(request.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
