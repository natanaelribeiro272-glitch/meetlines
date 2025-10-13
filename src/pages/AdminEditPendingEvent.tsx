import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiCategorySelect } from '@/components/MultiCategorySelect';
import { toast } from 'sonner';
import { ArrowLeft, Save, Check, Sparkles, Upload } from 'lucide-react';

export default function AdminEditPendingEvent() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organizer_name: '',
    event_date: '',
    end_date: '',
    location: '',
    location_link: '',
    ticket_price: 0,
    ticket_link: '',
    max_attendees: null as number | null,
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const categories = [
    { value: "festas", label: "🎉 Festas" },
    { value: "shows", label: "🎸 Shows" },
    { value: "eventos", label: "📅 Eventos" },
    { value: "eletronica", label: "🎵 Eletrônica" },
    { value: "rock", label: "🎸 Rock" },
    { value: "pop", label: "🎤 Pop" },
    { value: "forro", label: "🪗 Forró" },
    { value: "sertanejo", label: "🤠 Sertanejo" },
    { value: "funk", label: "🕺 Funk" },
    { value: "samba", label: "🥁 Samba" },
    { value: "jazz", label: "🎺 Jazz" },
    { value: "outros", label: "🎭 Outros" }
  ];

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
        .eq('approval_status', 'pending')
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          organizer_name: data.organizer_name || '',
          event_date: data.event_date || '',
          end_date: data.end_date || '',
          location: data.location || '',
          location_link: data.location_link || '',
          ticket_price: data.ticket_price || 0,
          ticket_link: data.ticket_link || '',
          max_attendees: data.max_attendees,
        });
        
        setSelectedCategories(data.category || []);
        
        if (data.image_url) {
          setEventImage(data.image_url);
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Erro ao carregar evento');
      navigate('/admin/pending-events');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEventImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.organizer_name || !formData.event_date || !formData.location) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = eventImage;

      // Upload image if a new file was selected
      if (eventImageFile) {
        const fileExt = eventImageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(filePath, eventImageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('platform_events')
        .update({
          title: formData.title,
          description: formData.description || null,
          organizer_name: formData.organizer_name,
          event_date: formData.event_date,
          end_date: formData.end_date || formData.event_date,
          location: formData.location,
          location_link: formData.location_link || null,
          image_url: imageUrl || null,
          category: selectedCategories.length > 0 ? selectedCategories : null,
          ticket_price: formData.ticket_price || 0,
          ticket_link: formData.ticket_link || null,
          max_attendees: formData.max_attendees,
        })
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Evento salvo com sucesso!');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Erro ao salvar evento');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAndPublish = async () => {
    await handleSave();
    
    try {
      const { error } = await supabase
        .from('platform_events')
        .update({ approval_status: 'approved' })
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Evento aprovado e publicado!');
      navigate('/admin/pending-events');
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('Erro ao publicar evento');
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.organizer_name || !formData.event_date || !formData.location) {
      toast.error('Preencha os campos obrigatórios antes de gerar a descrição');
      return;
    }

    setGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-event-description', {
        body: {
          title: formData.title,
          organizerName: formData.organizer_name,
          eventDate: formData.event_date,
          location: formData.location,
          category: selectedCategories,
          ticketPrice: formData.ticket_price,
        }
      });

      if (error) throw error;

      if (data?.description) {
        setFormData({ ...formData, description: data.description });
        toast.success('Descrição gerada com sucesso!');
      } else {
        throw new Error('Nenhuma descrição foi gerada');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Erro ao gerar descrição. Tente novamente.');
    } finally {
      setGeneratingDescription(false);
    }
  };

  if (adminLoading || loading || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/pending-events')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Evento Pendente</h1>
          <p className="text-muted-foreground">Revise e ajuste os dados antes de publicar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Banner do Evento */}
          <div className="space-y-2">
            <Label>Banner do Evento</Label>
            {eventImage ? (
              <div className="relative h-48 rounded-lg overflow-hidden">
                <img src={eventImage} alt="Preview do evento" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setEventImage(null);
                    setEventImageFile(null);
                  }}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Clique para adicionar uma imagem
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description">Descrição</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={generatingDescription || !formData.title}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generatingDescription ? 'Gerando...' : 'Gerar com IA'}
              </Button>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Clique em 'Gerar com IA' para criar uma descrição automática ou escreva manualmente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizer_name">Nome do Organizador *</Label>
            <Input
              id="organizer_name"
              value={formData.organizer_name}
              onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Data de Início *</Label>
              <Input
                id="event_date"
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_link">Link do Local (Google Maps)</Label>
            <Input
              id="location_link"
              type="url"
              value={formData.location_link}
              onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categorias</Label>
              <MultiCategorySelect 
                value={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="Selecione uma ou mais categorias"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_attendees">Capacidade Máxima</Label>
              <Input
                id="max_attendees"
                type="number"
                value={formData.max_attendees || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  max_attendees: e.target.value ? parseInt(e.target.value) : null 
                })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket_price">Preço do Ingresso (R$)</Label>
              <Input
                id="ticket_price"
                type="number"
                step="0.01"
                value={formData.ticket_price}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  ticket_price: parseFloat(e.target.value) || 0 
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket_link">Link de Compra</Label>
              <Input
                id="ticket_link"
                type="url"
                value={formData.ticket_link}
                onChange={(e) => setFormData({ ...formData, ticket_link: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              variant="outline"
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
            <Button 
              onClick={handleApproveAndPublish}
              disabled={saving}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Salvar e Publicar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}