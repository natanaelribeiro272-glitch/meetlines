import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, ExternalLink, Calendar, MapPin, User, MessageSquare } from 'lucide-react';
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
    location: string;
    image_url: string | null;
    description: string | null;
  };
  organizers: {
    id: string;
    username: string;
    page_title: string;
    avatar_url: string | null;
    page_description: string | null;
    category: string | null;
  };
}

export default function AdminClaimRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [requests, setRequests] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
      return;
    }

    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin, adminLoading, navigate]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('event_claim_requests')
        .select(`
          *,
          platform_events (id, title, organizer_name, event_date, location, image_url, description),
          organizers (id, username, page_title, avatar_url, page_description, category)
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
      // Get platform event details
      const { data: platformEvent, error: fetchError } = await supabase
        .from('platform_events')
        .select('*')
        .eq('id', platformEventId)
        .single();

      if (fetchError) throw fetchError;
      if (!platformEvent) throw new Error('Evento não encontrado');

      // Create event for organizer
      const { error: createError } = await supabase
        .from('events')
        .insert({
          organizer_id: organizerId,
          title: platformEvent.title,
          description: platformEvent.description,
          event_date: platformEvent.event_date,
          end_date: platformEvent.end_date,
          location: platformEvent.location,
          location_link: platformEvent.location_link,
          image_url: platformEvent.image_url,
          category: platformEvent.category,
          max_attendees: platformEvent.max_attendees,
          ticket_price: platformEvent.ticket_price,
          ticket_link: platformEvent.ticket_link,
          status: platformEvent.status
        });

      if (createError) throw createError;

      // Update platform event as claimed
      const { error: eventError } = await supabase
        .from('platform_events')
        .update({ claimed_by_organizer_id: organizerId })
        .eq('id', platformEventId);

      if (eventError) throw eventError;

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

      toast.success('Solicitação aprovada! Evento criado para o organizador.');
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

  if (adminLoading || !isAdmin) return null;

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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação ainda</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Quando organizadores solicitarem associação a eventos da plataforma, eles aparecerão aqui para você aprovar ou rejeitar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              {request.platform_events.image_url && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={request.platform_events.image_url} 
                    alt={request.platform_events.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-2xl">{request.platform_events.title}</CardTitle>
                    <CardDescription>
                      Solicitado em {format(new Date(request.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    request.status === 'pending' ? 'default' :
                    request.status === 'approved' ? 'secondary' : 'destructive'
                  } className="text-sm">
                    {request.status === 'pending' ? '⏳ Pendente' :
                     request.status === 'approved' ? '✓ Aprovado' : '✗ Rejeitado'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Event Details */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Detalhes do Evento
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(request.platform_events.event_date), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="text-sm">{request.platform_events.location}</span>
                    </div>
                    {request.platform_events.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {request.platform_events.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Organizer Profile */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Organizador Solicitante
                  </h3>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={request.organizers.avatar_url || ''} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-lg">{request.organizers.page_title}</p>
                        {request.organizers.category && (
                          <Badge variant="outline" className="text-xs">
                            {request.organizers.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        @{request.organizers.username}
                      </p>
                      {request.organizers.page_description && (
                        <p className="text-sm text-muted-foreground">
                          {request.organizers.page_description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Request Message */}
                {request.message && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                    <div className="flex gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                      <p className="text-sm font-medium text-blue-500">Mensagem do Organizador</p>
                    </div>
                    <p className="text-sm pl-6">{request.message}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/@${request.organizers.username}`)}
                    className="flex-1 min-w-[200px]"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Perfil Completo
                  </Button>
                  
                  {request.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleApprove(request.id, request.platform_events.id, request.organizers.id)}
                        className="flex-1 min-w-[150px]"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(request.id)}
                        className="flex-1 min-w-[150px]"
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
