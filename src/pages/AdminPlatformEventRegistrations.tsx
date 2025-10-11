import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Mail, Phone, User } from 'lucide-react';

interface Registration {
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  status: string;
  attendance_confirmed: boolean;
  created_at: string;
  registration_data: any;
}

export default function AdminPlatformEventRegistrations() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin && eventId) {
      fetchData();
    }
  }, [isAdmin, eventId]);

  const fetchData = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('platform_events')
        .select('title')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEventTitle(eventData.title);

      // Fetch registrations
      const { data: regsData, error: regsError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (regsError) throw regsError;
      setRegistrations(regsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || !isAdmin) {
    return null;
  }

  const confirmedCount = registrations.filter(r => r.attendance_confirmed).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate('/admin/platform-events')}>
          ← Voltar
        </Button>
        <h1 className="text-3xl font-bold mt-2">{eventTitle}</h1>
        <p className="text-muted-foreground">
          {registrations.length} cadastros | {confirmedCount} presenças confirmadas
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum cadastro encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <Card key={reg.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {reg.user_name}
                  </CardTitle>
                  {reg.attendance_confirmed && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Presença Confirmada
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${reg.user_email}`} className="hover:underline">
                    {reg.user_email}
                  </a>
                </div>
                {reg.user_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${reg.user_phone}`} className="hover:underline">
                      {reg.user_phone}
                    </a>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Cadastrado em: {format(new Date(reg.created_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                {reg.registration_data && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Dados adicionais:</p>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(reg.registration_data, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
