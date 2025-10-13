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
  category: string[] | null;
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
      
      // Automatically update status of past events
      const now = new Date();
      const eventsToUpdate = (data || []).filter(event => {
        const eventEndDate = new Date(event.end_date || event.event_date);
        return eventEndDate < now && event.status !== 'ended';
      });

      // Update past events to 'ended' status
      if (eventsToUpdate.length > 0) {
        const updatePromises = eventsToUpdate.map(event =>
          supabase
            .from('platform_events')
            .update({ status: 'ended' })
            .eq('id', event.id)
        );
        
        await Promise.all(updatePromises);
        console.log(`Auto-ended ${eventsToUpdate.length} past events`);
        
        // Fetch again to get updated data
        const { data: updatedData, error: refetchError } = await supabase
          .from('platform_events')
          .select('*')
          .order('event_date', { ascending: true });
        
        if (refetchError) throw refetchError;
        setEvents(updatedData || []);
      } else {
        setEvents(data || []);
      }
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

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('platform_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      toast.success('Evento excluído com sucesso');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erro ao excluir evento');
    }
  };

  const categorizeEvents = () => {
    const now = new Date();
    
    const upcoming = events.filter(event => {
      const start = new Date(event.event_date);
      const end = event.end_date ? new Date(event.end_date) : null;
      return start > now && event.status !== 'ended';
    });

    const live = events.filter(event => {
      const start = new Date(event.event_date);
      const end = event.end_date ? new Date(event.end_date) : null;
      return start <= now && (!end || end > now) && event.status !== 'ended';
    });

    const ended = events.filter(event => {
      const end = event.end_date ? new Date(event.end_date) : new Date(event.event_date);
      return end < now || event.status === 'ended';
    });

    return { upcoming, live, ended };
  };

  const { upcoming, live, ended } = categorizeEvents();

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
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum evento da plataforma encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Eventos Acontecendo Agora */}
          {live.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                Acontecendo Agora ({live.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                {live.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    {event.image_url && (
                      <div className="h-32 overflow-hidden">
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm line-clamp-2">{event.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {event.organizer_name}
                      </p>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">
                          {format(new Date(event.event_date), "d/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/platform-event/${event.id}/edit`)}
                          className="flex-1 h-7 text-xs"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/platform-event/${event.id}/registrations`)}
                          className="flex-1 h-7 text-xs"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleEndEvent(event.id)}
                          className="h-7 text-xs"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Próximos Eventos */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Próximos Eventos ({upcoming.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                {upcoming.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    {event.image_url && (
                      <div className="h-32 overflow-hidden">
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm line-clamp-2">{event.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {event.organizer_name}
                      </p>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">
                          {format(new Date(event.event_date), "d/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/platform-event/${event.id}/edit`)}
                          className="flex-1 h-7 text-xs"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/platform-event/${event.id}/registrations`)}
                          className="flex-1 h-7 text-xs"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleEndEvent(event.id)}
                          className="h-7 text-xs"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Eventos Realizados */}
          {ended.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5" />
                Eventos Realizados ({ended.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                {ended.map((event) => (
                  <Card key={event.id} className="overflow-hidden opacity-75">
                    {event.image_url && (
                      <div className="h-32 overflow-hidden">
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover grayscale"
                        />
                      </div>
                    )}
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm line-clamp-2">{event.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {event.organizer_name}
                      </p>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">
                          {format(new Date(event.event_date), "d/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/platform-event/${event.id}/registrations`)}
                          className="flex-1 h-7 text-xs"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="h-7 text-xs"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
