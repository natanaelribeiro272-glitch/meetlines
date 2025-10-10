import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import RegistrationFormDialog from '@/components/RegistrationFormDialog';
import { FormField } from '@/components/FormFieldsConfig';
import { toast } from 'sonner';
import { ArrowLeft, Upload, MapPin, Calendar, Users, DollarSign, FileText } from 'lucide-react';

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

export default function AdminCreatePlatformEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState<"presencial" | "live">("presencial");
  const [isFree, setIsFree] = useState(true);
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organizer_name: '',
    date: '',
    time: '',
    end_date: '',
    end_time: '',
    address: '',
    location_link: '',
    category: '',
    max_attendees: '',
    ticket_price: '',
    ticket_link: ''
  });

  if (!isAdmin) {
    navigate('/');
    return null;
  }

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
    if (!user) return;

    if (!formData.title || !formData.organizer_name || !formData.date || !formData.time) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (eventType === "presencial" && !formData.address) {
      toast.error('Preencha o endereço do evento');
      return;
    }

    if (eventType === "live" && !formData.location_link) {
      toast.error('Preencha o link da transmissão');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;

      // Upload image if exists
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

      // Combine date and time
      const eventDateTime = new Date(`${formData.date}T${formData.time}`);
      
      // Combine end date and time if provided
      let eventEndDateTime = null;
      if (formData.end_date && formData.end_time) {
        eventEndDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      }

      const { error } = await supabase.from('platform_events').insert({
        title: formData.title,
        description: formData.description,
        organizer_name: formData.organizer_name,
        event_date: eventDateTime.toISOString(),
        end_date: eventEndDateTime ? eventEndDateTime.toISOString() : null,
        location: eventType === "live" ? "Online" : formData.address,
        location_link: formData.location_link || null,
        category: formData.category || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        image_url: imageUrl,
        created_by_admin_id: user.id
      });

      if (error) throw error;

      toast.success('Evento da plataforma criado com sucesso!');
      navigate('/admin');
    } catch (error: any) {
      console.error('Error creating platform event:', error);
      toast.error('Erro ao criar evento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            Criar Evento da Plataforma
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto pb-20">
        <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            Eventos da plataforma não são associados a nenhum organizador específico.
            Organizadores poderão reivindicar esses eventos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Arte do Evento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Arte do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
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
            </CardContent>
          </Card>

          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Nome do Evento *</Label>
                <Input
                  id="title"
                  placeholder="Digite o nome do evento"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="organizer_name">Nome do Organizador *</Label>
                <Input
                  id="organizer_name"
                  placeholder="Nome que aparecerá como organizador"
                  value={formData.organizer_name}
                  onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o evento..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tipo de Evento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tipo de Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={eventType} onValueChange={(value) => setEventType(value as "presencial" | "live")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="presencial" id="presencial" />
                  <Label htmlFor="presencial" className="cursor-pointer">
                    📍 Evento Presencial
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="live" id="live" />
                  <Label htmlFor="live" className="cursor-pointer">
                    🔴 Evento Live (Online)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Data e Hora */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data e Hora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Início do Evento</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date" className="text-xs text-muted-foreground">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-xs text-muted-foreground">Horário *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-sm font-medium mb-2 block">Encerramento (Opcional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="end_date" className="text-xs text-muted-foreground">Data</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time" className="text-xs text-muted-foreground">Horário</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {eventType === "live" ? "Link da Transmissão" : "Localização"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {eventType === "presencial" ? (
                <>
                  <div>
                    <Label htmlFor="address">Endereço Completo *</Label>
                    <Input
                      id="address"
                      placeholder="Rua, número, bairro, cidade..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location_link">Link do Endereço</Label>
                    <Input
                      id="location_link"
                      type="url"
                      placeholder="https://maps.google.com/..."
                      value={formData.location_link}
                      onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="location_link">Link da Transmissão *</Label>
                  <Input
                    id="location_link"
                    type="url"
                    placeholder="https://youtube.com/... ou outro link"
                    value={formData.location_link}
                    onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
                    required
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capacidade e Ingresso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Capacidade e Ingresso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="max_attendees">Número Máximo de Participantes</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  placeholder="Deixe em branco para ilimitado"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                  min="1"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_free">Evento Gratuito</Label>
                <Switch
                  id="is_free"
                  checked={isFree}
                  onCheckedChange={setIsFree}
                />
              </div>

              {!isFree && (
                <>
                  <div>
                    <Label htmlFor="ticket_price" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Valor do Ingresso
                    </Label>
                    <Input
                      id="ticket_price"
                      placeholder="Ex: R$ 50,00"
                      value={formData.ticket_price}
                      onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ticket_link">Link para Compra</Label>
                    <Input
                      id="ticket_link"
                      type="url"
                      placeholder="https://..."
                      value={formData.ticket_link}
                      onChange={(e) => setFormData({ ...formData, ticket_link: e.target.value })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Formulário de Cadastro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Formulário de Cadastro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requires_registration">
                    Requer Cadastro dos Participantes
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nome, email e telefone sempre serão coletados
                  </p>
                </div>
                <Switch
                  id="requires_registration"
                  checked={requiresRegistration}
                  onCheckedChange={setRequiresRegistration}
                />
              </div>

              {requiresRegistration && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormDialogOpen(true)}
                  className="w-full"
                >
                  Configurar Campos Personalizados
                  {formFields.length > 0 && (
                    <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      {formFields.length}
                    </span>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Evento'}
          </Button>
        </form>
      </div>

      <RegistrationFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        fields={formFields}
        onSave={setFormFields}
      />
    </div>
  );
}
