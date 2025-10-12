import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Check, X, ArrowLeft, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string;
  location: string;
  image_url: string | null;
  organizer_name: string;
  category: string | null;
  ticket_price: number | null;
  max_attendees: number | null;
  source_data: any;
}

export default function AdminPendingEvents() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingEvents();
    }
  }, [isAdmin]);

  const fetchPendingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_events')
        .select('*')
        .eq('auto_generated', true)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching pending events:', error);
      toast.error('Erro ao carregar eventos pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('platform_events')
        .update({ approval_status: 'approved' })
        .eq('id', eventId);

      if (error) throw error;
      
      toast.success('Evento aprovado com sucesso!');
      fetchPendingEvents();
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('Erro ao aprovar evento');
    }
  };

  const handleReject = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('platform_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      toast.success('Evento rejeitado');
      fetchPendingEvents();
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error('Erro ao rejeitar evento');
    }
  };

  if (adminLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Eventos Pendentes de Aprovação</h1>
          <p className="text-muted-foreground">Eventos gerados automaticamente aguardando revisão</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">Nenhum evento pendente de aprovação</p>
            <Button onClick={() => navigate('/admin/auto-generate-events')}>
              Gerar Novos Eventos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              {event.image_url && event.image_url.trim() !== '' && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Por: {event.organizer_name}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {event.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(event.event_date), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                  {event.category && (
                    <div className="inline-block px-2 py-1 bg-primary/10 rounded-full text-xs">
                      {event.category}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => navigate(`/admin/pending-event/${event.id}/edit`)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleApprove(event.id)}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => handleReject(event.id)}
                    variant="destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}