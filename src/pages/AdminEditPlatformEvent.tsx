import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AdminEditPlatformEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    end_date: '',
    location: '',
    location_link: '',
    organizer_name: '',
    max_attendees: '',
    category: '',
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin && eventId) {
      fetchEvent();
    }
  }, [isAdmin, eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        description: data.description || '',
        event_date: data.event_date,
        end_date: data.end_date || '',
        location: data.location,
        location_link: data.location_link || '',
        organizer_name: data.organizer_name,
        max_attendees: data.max_attendees?.toString() || '',
        category: data.category || '',
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('platform_events')
        .update({
          title: formData.title,
          description: formData.description,
          event_date: formData.event_date,
          end_date: formData.end_date || null,
          location: formData.location,
          location_link: formData.location_link || null,
          organizer_name: formData.organizer_name,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          category: formData.category || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Evento atualizado com sucesso!');
      navigate('/admin/platform-events');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Erro ao atualizar evento');
    } finally {
      setSubmitting(false);
    }
  };

  if (adminLoading || !isAdmin || loading) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate('/admin/platform-events')} className="mb-4">
        ← Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Editar Evento da Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título do Evento</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Nome do Organizador</label>
              <Input
                value={formData.organizer_name}
                onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data/Hora Início</label>
                <Input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data/Hora Fim</label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Local</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Link do Local</label>
              <Input
                type="url"
                value={formData.location_link}
                onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Capacidade Máxima</label>
              <Input
                type="number"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                placeholder="Deixe em branco para ilimitado"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Show, Festival, Workshop..."
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
