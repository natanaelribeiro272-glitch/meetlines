import { useState, useEffect } from "react";
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Registration {
  id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  status: string;
  created_at: string;
  registration_data?: any;
  event: {
    id: string;
    title: string;
    event_date: string;
    location: string;
    form_fields?: any[];
  };
}

interface EventRegistrationsProps {
  onBack: () => void;
  eventId?: string;
}

export default function EventRegistrations({ onBack, eventId }: EventRegistrationsProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Get registrations for events created by this organizer
        let query = supabase
          .from('event_registrations')
          .select(`
            id,
            user_name,
            user_email,
            user_phone,
            status,
            created_at,
            registration_data,
            event:events!inner(
              id,
              title,
              event_date,
              location,
              form_fields,
              organizer:organizers!inner(
                user_id
              )
            )
          `)
          .eq('event.organizer.user_id', user.id);
        
        // If eventId is provided, filter by that specific event
        if (eventId) {
          query = query.eq('event_id', eventId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching registrations:', error);
          toast.error('Erro ao carregar cadastros');
          return;
        }

        setRegistrations(data?.map(reg => ({
          ...reg,
          registration_data: (reg.registration_data as any) || {},
          event: {
            ...reg.event,
            form_fields: (reg.event.form_fields as any) || []
          }
        })) || []);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Erro ao carregar cadastros');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [user, eventId]);

  const filteredRegistrations = registrations.filter(
    (registration) =>
      registration.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: "bg-green-500/20 text-green-400",
      pending: "bg-yellow-500/20 text-yellow-400",
      cancelled: "bg-red-500/20 text-red-400",
    };
    return colors[status as keyof typeof colors] || colors.confirmed;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-4 p-4 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Cadastros dos Eventos</h1>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">Cadastros dos Eventos</h1>
          <p className="text-sm text-muted-foreground">
            {filteredRegistrations.length} cadastro(s) encontrado(s)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 max-w-md mx-auto">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou evento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length > 0 ? (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <Card key={registration.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {registration.user_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {registration.event.title}
                      </p>
                    </div>
                    <Badge className={getStatusBadge(registration.status)}>
                      {registration.status === 'confirmed' ? 'Confirmado' :
                       registration.status === 'pending' ? 'Pendente' :
                       'Cancelado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {registration.user_email}
                    </div>
                    
                    {registration.user_phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {registration.user_phone}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(registration.event.event_date).toLocaleDateString('pt-BR')}
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {registration.event.location}
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Cadastrado em: {new Date(registration.created_at).toLocaleDateString('pt-BR')}
                    </div>

                    {/* Custom Form Data */}
                    {registration.registration_data && Object.keys(registration.registration_data).length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <p className="text-xs font-semibold text-foreground">Dados Personalizados:</p>
                        {Object.entries(registration.registration_data).map(([key, value]) => (
                          <div key={key} className="text-xs">
                            <span className="font-medium text-foreground">{key}:</span>{' '}
                            <span className="text-muted-foreground">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum cadastro encontrado' : 'Nenhum cadastro ainda'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm ? 'Tente buscar por outro termo' : 'Os cadastros dos seus eventos aparecerão aqui'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}