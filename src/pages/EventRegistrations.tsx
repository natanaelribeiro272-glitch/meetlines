import { useState, useEffect } from "react";
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Users, Search, Download, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Registration {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  status: string;
  created_at: string;
  registration_data?: any;
  user_avatar?: string;
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
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [deletingRegistration, setDeletingRegistration] = useState<string | null>(null);
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
            user_id,
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

        // Fetch user avatars
        const userIds = data?.map(reg => reg.user_id) || [];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, avatar_url')
          .in('user_id', userIds);

        const avatarMap = new Map(profiles?.map(p => [p.user_id, p.avatar_url]) || []);

        setRegistrations(data?.map(reg => ({
          ...reg,
          user_avatar: avatarMap.get(reg.user_id),
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

  const handleDownload = (fieldName: string, value: any) => {
    // Check if it's a data URL (uploaded file)
    if (typeof value === 'string' && value.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = value;
      link.download = `${fieldName}.${value.split(';')[0].split('/')[1]}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download iniciado');
    } else {
      toast.error('Arquivo não disponível para download');
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) {
        console.error('Error deleting registration:', error);
        toast.error('Erro ao excluir cadastro');
        return;
      }

      // Remove from local state
      setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
      setSelectedRegistration(null);
      setDeletingRegistration(null);
      toast.success('Cadastro excluído com sucesso. O usuário pode se cadastrar novamente.');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao excluir cadastro');
    }
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
          <div className="space-y-2">
            {filteredRegistrations.map((registration) => (
              <Card 
                key={registration.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedRegistration(registration)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={registration.user_avatar} />
                      <AvatarFallback>
                        {registration.user_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {registration.user_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {registration.event.title}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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

      {/* Details Dialog */}
      <Dialog open={!!selectedRegistration} onOpenChange={(open) => !open && setSelectedRegistration(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {selectedRegistration && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Cadastro</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedRegistration.user_avatar} />
                    <AvatarFallback className="text-lg">
                      {selectedRegistration.user_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{selectedRegistration.user_name}</h3>
                    <Badge className={getStatusBadge(selectedRegistration.status)}>
                      {selectedRegistration.status === 'confirmed' ? 'Confirmado' :
                       selectedRegistration.status === 'pending' ? 'Pendente' :
                       'Cancelado'}
                    </Badge>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRegistration.user_email}</span>
                  </div>
                  
                  {selectedRegistration.user_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedRegistration.user_phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Evento: {new Date(selectedRegistration.event.event_date).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRegistration.event.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Cadastrado em: {new Date(selectedRegistration.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Custom Form Data */}
                {selectedRegistration.registration_data && Object.keys(selectedRegistration.registration_data).length > 0 && (
                  <div className="pt-4 border-t space-y-3">
                    <h4 className="font-semibold text-sm">Dados Personalizados</h4>
                    {Object.entries(selectedRegistration.registration_data).map(([key, value]) => {
                      const isImage = typeof value === 'string' && value.startsWith('data:image/');
                      const isFile = typeof value === 'string' && value.startsWith('data:');
                      
                      return (
                        <div key={key} className="space-y-2">
                          <p className="text-sm font-medium">{key}</p>
                          {isImage ? (
                            <div className="space-y-2">
                              <img 
                                src={value as string} 
                                alt={key}
                                className="w-full h-auto rounded border max-h-64 object-contain"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(key, value)}
                                className="w-full"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Baixar Imagem
                              </Button>
                            </div>
                          ) : isFile ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(key, value)}
                              className="w-full"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar Arquivo
                            </Button>
                          ) : Array.isArray(value) ? (
                            <p className="text-sm text-muted-foreground">{value.join(', ')}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">{String(value)}</p>
                          )}
                        </div>
                      );
                     })}
                   </div>
                 )}

                 {/* Delete Button */}
                 <div className="pt-4 border-t">
                   <Button
                     variant="destructive"
                     className="w-full"
                     onClick={() => setDeletingRegistration(selectedRegistration.id)}
                   >
                     <Trash2 className="h-4 w-4 mr-2" />
                     Excluir Cadastro
                   </Button>
                   <p className="text-xs text-muted-foreground text-center mt-2">
                     Ao excluir, o usuário poderá se cadastrar novamente
                   </p>
                 </div>
               </div>
             </>
           )}
         </DialogContent>
       </Dialog>

       {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!deletingRegistration} onOpenChange={(open) => !open && setDeletingRegistration(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Excluir Cadastro?</AlertDialogTitle>
             <AlertDialogDescription>
               Esta ação não pode ser desfeita. O cadastro será permanentemente excluído e o usuário poderá se cadastrar novamente no evento.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction
               onClick={() => deletingRegistration && handleDeleteRegistration(deletingRegistration)}
               className="bg-destructive hover:bg-destructive/90"
             >
               Excluir
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }