import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Edit, XCircle, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlatformEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string;
  image_url: string | null;
  organizer_name: string;
  category: string | null;
  status: string;
  max_attendees: number | null;
}

export default function AdminPlatformEvents() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
    }
  }, [isAdmin]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching platform events:', error);
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleEndEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('platform_events')
        .update({ status: 'ended' })
        .eq('id', eventId);

      if (error) throw error;
      toast.success('Evento encerrado com sucesso');
      fetchEvents();
    } catch (error) {
      console.error('Error ending event:', error);
      toast.error('Erro ao encerrar evento');
    }
  };

  if (adminLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            ← Voltar
          </Button>
          <h1 className="text-3xl font-bold mt-2">Eventos da Plataforma</h1>
          <p className="text-muted-foreground">Gerencie todos os eventos criados pela plataforma</p>
        </div>
        <Button onClick={() => navigate('/admin/create-platform-event')}>
          Criar Novo Evento
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum evento da plataforma encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              {event.image_url && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Por: {event.organizer_name}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    event.status === 'ended' 
                      ? 'bg-red-500/20 text-red-500' 
                      : event.status === 'live'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    {event.status === 'ended' ? 'Encerrado' : event.status === 'live' ? 'Ao Vivo' : 'Em Breve'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  {event.max_attendees && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Capacidade: {event.max_attendees} pessoas</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/platform-event/${event.id}/edit`)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/platform-event/${event.id}/registrations`)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Cadastros
                  </Button>
                  {event.status !== 'ended' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleEndEvent(event.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Encerrar
                    </Button>
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
