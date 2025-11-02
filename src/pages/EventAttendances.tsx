import { useEffect, useState } from "react";
import { ArrowLeft, Users, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AttendanceItem {
  id: string;
  user_name: string;
  user_email: string;
  created_at: string;
}

interface EventAttendancesProps {
  onBack: () => void;
  eventId?: string;
}

export default function EventAttendances({ onBack, eventId }: EventAttendancesProps) {
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAttendances = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // For now, we use confirmed registrations as "confirmed presence"
        let query = supabase
          .from('event_registrations')
          .select(`id, user_name, user_email, created_at, event:events!inner(id, organizer:organizers!inner(user_id))`)
          .eq('status', 'confirmed')
          .eq('event.organizer.user_id', user.id);

        if (eventId) {
          query = query.eq('event_id', eventId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching attendances:', error);
          toast.error('Erro ao carregar presenças');
          return;
        }

        // Map to a simpler shape
        const mapped = (data || []).map((r: any) => ({
          id: r.id,
          user_name: r.user_name,
          user_email: r.user_email,
          created_at: r.created_at,
        }));
        setAttendances(mapped);
      } catch (e) {
        console.error(e);
        toast.error('Erro ao carregar presenças');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendances();
  }, [user, eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-4 p-4 border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Presenças Confirmadas</h1>
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
          <h1 className="text-lg font-semibold text-foreground">Presenças Confirmadas</h1>
          <p className="text-sm text-muted-foreground">
            {attendances.length} presença(s) confirmada(s)
          </p>
        </div>
      </div>

      {/* List */}
      <div className="p-4 max-w-md mx-auto">
        {attendances.length > 0 ? (
          <div className="space-y-4">
            {attendances.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {a.user_name}
                    </CardTitle>
                    <Badge className="bg-primary/10 text-primary border-primary/20">Confirmado</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div>{a.user_email}</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Confirmado em: {new Date(a.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma presença confirmada ainda</p>
            <p className="text-sm text-muted-foreground mt-2">Assim que alguém confirmar presença, aparecerá aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
