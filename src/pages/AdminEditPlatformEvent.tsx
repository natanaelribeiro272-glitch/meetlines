import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

const EVENT_CATEGORIES = [
  { value: "cristao", label: "🙏 Cristão" },
  { value: "vendas", label: "💰 Vendas" },
  { value: "streemer", label: "🎮 Streemer" },
  { value: "festas", label: "🎉 Festas" },
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
    ticket_price: '',
    ticket_link: '',
  });
  
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [isPaid, setIsPaid] = useState(false);

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
        ticket_price: (data as any).ticket_price?.toString() || '',
        ticket_link: (data as any).ticket_link || '',
      });
      
      setEventImage((data as any).image_url || null);
      
      // Determinar se é pago baseado no preço ou link
      const ticketPrice = (data as any).ticket_price;
      const ticketLink = (data as any).ticket_link;
      setIsPaid(!!(ticketPrice && ticketPrice > 0) || !!ticketLink);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEventImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setEventImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imageUrl = eventImage;

      // Upload image if a new one was selected
      if (eventImageFile) {
        const fileExt = eventImageFile.name.split('.').pop();
        const fileName = `platform-events/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, eventImageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

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
          image_url: imageUrl,
          ticket_price: isPaid && formData.ticket_price ? parseFloat(formData.ticket_price) : 0,
          ticket_link: isPaid ? (formData.ticket_link || null) : null,
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
            {/* Imagem do Evento */}
            <div>
              <Label>Banner do Evento</Label>
              <div className="mt-2">
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
            </div>

            <div>
              <Label>Título do Evento</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Nome do Organizador</Label>
              <Input
                value={formData.organizer_name}
                onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label>Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {EVENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data/Hora Início *</Label>
                <Input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Data/Hora Fim *</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Local</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Link do Local</Label>
              <Input
                type="url"
                value={formData.location_link}
                onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div>
              <Label>Capacidade Máxima</Label>
              <Input
                type="number"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                placeholder="Deixe em branco para ilimitado"
              />
            </div>

            {/* Informações de Pagamento */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Informações de Pagamento</h3>
              
              <div>
                <Label>Tipo de Evento</Label>
                <RadioGroup 
                  value={isPaid ? "paid" : "free"} 
                  onValueChange={(value) => {
                    setIsPaid(value === "paid");
                    if (value === "free") {
                      setFormData({ ...formData, ticket_price: '', ticket_link: '' });
                    }
                  }}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free" id="free" />
                    <Label htmlFor="free" className="cursor-pointer font-normal">
                      💚 Gratuito
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid" className="cursor-pointer font-normal">
                      💰 Pago
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {isPaid && (
                <>
                  <div>
                    <Label>Preço do Ingresso (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.ticket_price}
                      onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                      placeholder="Ex: 50.00"
                    />
                  </div>

                  <div>
                    <Label>Link de Pagamento/Ingresso</Label>
                    <Input
                      type="url"
                      value={formData.ticket_link}
                      onChange={(e) => setFormData({ ...formData, ticket_link: e.target.value })}
                      placeholder="https://sympla.com.br/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Link externo para compra de ingressos (Sympla, Eventbrite, etc)
                    </p>
                  </div>
                </>
              )}
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
