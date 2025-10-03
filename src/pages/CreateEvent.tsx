import { useState, useEffect } from "react";
import { ArrowLeft, Upload, MapPin, Calendar, Clock, Users, DollarSign, FileText, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormBuilder, { FormField } from "@/components/FormBuilder";
import { useOrganizer } from "@/hooks/useOrganizer";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const INTEREST_OPTIONS = [{
  value: "curtição",
  label: "🤙 Curtição",
  emoji: "🤙"
}, {
  value: "namoro",
  label: "💗 Namoro",
  emoji: "💗"
}, {
  value: "network",
  label: "🤝 Network",
  emoji: "🤝"
}, {
  value: "amizade",
  label: "🤝 Amizade",
  emoji: "🤝"
}, {
  value: "casual",
  label: "🤪 Casual",
  emoji: "🤪"
}];

const EVENT_CATEGORIES = [
  { value: "cristao", label: "🙏 Cristão" },
  { value: "lives", label: "🔴 Lives" },
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
interface CreateEventProps {
  onBack: () => void;
  eventId?: string; // Para edição futura
}
export default function CreateEvent({
  onBack,
  eventId
}: CreateEventProps) {
  const {
    createEvent
  } = useOrganizer();
  const {
    profile,
    updateProfile
  } = useProfile();
  const [isEditMode, setIsEditMode] = useState(false);
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    address: "",
    locationLink: "",
    maxAttendees: "",
    ticketPrice: "",
    category: ""
  });
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<string>("");
  const [publicNotes, setPublicNotes] = useState(profile?.notes || "");
  const [notesVisible, setNotesVisible] = useState(true);
  const [eventType, setEventType] = useState<"presencial" | "live">("presencial");
  
  // Load event data if editing
  useEffect(() => {
    const loadEventData = async () => {
      if (eventId) {
        setIsEditMode(true);
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            // Parse date and time from event_date
            const eventDate = new Date(data.event_date);
            const dateStr = eventDate.toISOString().split('T')[0];
            const timeStr = eventDate.toTimeString().slice(0, 5);
            
            setEventData({
              title: data.title || "",
              description: data.description || "",
              date: dateStr,
              time: timeStr,
              location: data.location || "",
              address: data.is_live ? "" : data.location || "",
              locationLink: data.location_link || "",
              maxAttendees: data.max_attendees?.toString() || "",
              ticketPrice: "",
              category: data.category || ""
            });
            
            setEventImage(data.image_url || null);
            setEventType(data.is_live ? "live" : "presencial");
            setRequiresRegistration(data.requires_registration || false);
            
            if (data.interests && data.interests.length > 0) {
              setSelectedInterest(data.interests[0]);
            }
          }
        } catch (error) {
          console.error('Error loading event:', error);
          toast.error('Erro ao carregar evento');
        }
      }
    };
    
    loadEventData();
  }, [eventId]);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEventImageFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        setEventImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação condicional baseada no tipo de evento
    if (!eventData.title || !eventData.date || !eventData.time) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (eventType === "presencial" && !eventData.address) {
      toast.error('Preencha o endereço do evento');
      return;
    }
    
    if (eventType === "live" && !eventData.locationLink) {
      toast.error('Preencha o link da transmissão');
      return;
    }
    try {
      setIsCreating(true);
      let imageUrl = null;

      // Upload image if exists
      if (eventImageFile) {
        const fileExt = eventImageFile.name.split('.').pop();
        const fileName = `events/${Date.now()}.${fileExt}`;
        const {
          error: uploadError
        } = await supabase.storage.from('user-uploads').upload(fileName, eventImageFile);
        if (uploadError) throw uploadError;
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('user-uploads').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      // Combine date and time
      const eventDateTime = new Date(`${eventData.date}T${eventData.time}`);

      // Update public notes if changed
      if (publicNotes !== profile?.notes) {
        await updateProfile({
          notes: publicNotes
        });
      }
      
      if (isEditMode && eventId) {
        // Update existing event
        const { error: updateError } = await supabase
          .from('events')
          .update({
            title: eventData.title,
            description: eventData.description,
            event_date: eventDateTime.toISOString(),
            location: eventType === "live" ? "Online" : eventData.address,
            location_link: eventData.locationLink || null,
            image_url: imageUrl || eventImage,
            max_attendees: eventData.maxAttendees ? parseInt(eventData.maxAttendees) : null,
            interests: selectedInterest ? [selectedInterest] : [],
            is_live: eventType === "live",
            requires_registration: requiresRegistration,
            category: eventData.category || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId);
        
        if (updateError) throw updateError;
        toast.success('Evento atualizado com sucesso!');
      } else {
        // Create new event
        await createEvent({
          title: eventData.title,
          description: eventData.description,
          event_date: eventDateTime.toISOString(),
          location: eventType === "live" ? "Online" : eventData.address,
          location_link: eventData.locationLink || null,
          image_url: imageUrl,
          max_attendees: eventData.maxAttendees ? parseInt(eventData.maxAttendees) : null,
          interests: selectedInterest ? [selectedInterest] : [],
          is_live: eventType === "live",
          status: 'upcoming',
          requires_registration: requiresRegistration,
          category: eventData.category || null
        });
        toast.success('Evento criado com sucesso!');
      }
      
      onBack();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(isEditMode ? 'Erro ao atualizar evento' : 'Erro ao criar evento');
    } finally {
      setIsCreating(false);
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            {isEditMode ? 'Editar Evento' : 'Criar Evento'}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Imagem do Evento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Arte do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {eventImage ? <div className="relative h-48 rounded-lg overflow-hidden">
                    <img src={eventImage} alt="Preview do evento" className="w-full h-full object-cover" />
                    <Button type="button" variant="secondary" size="sm" className="absolute top-2 right-2" onClick={() => setEventImage(null)}>
                      Remover
                    </Button>
                  </div> : <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Clique para adicionar uma imagem
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>}
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
                <Label htmlFor="title">Nome do Evento</Label>
                <Input id="title" placeholder="Digite o nome do evento" value={eventData.title} onChange={e => handleInputChange("title", e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" placeholder="Descreva seu evento..." value={eventData.description} onChange={e => handleInputChange("description", e.target.value)} rows={3} />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={eventData.category} onValueChange={(value) => handleInputChange("category", value)}>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" type="date" value={eventData.date} onChange={e => handleInputChange("date", e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="time">Horário</Label>
                  <Input id="time" type="time" value={eventData.time} onChange={e => handleInputChange("time", e.target.value)} required />
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
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input id="address" placeholder="Rua, número, bairro, cidade..." value={eventData.address} onChange={e => handleInputChange("address", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="locationLink">Link do Endereço</Label>
                    <Input id="locationLink" type="url" placeholder="https://maps.google.com/..." value={eventData.locationLink} onChange={e => handleInputChange("locationLink", e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">
                      Cole o link do Google Maps ou Waze
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="locationLink">Link da Live</Label>
                  <Input id="locationLink" type="url" placeholder="https://youtube.com/live/... ou https://twitch.tv/..." value={eventData.locationLink} onChange={e => handleInputChange("locationLink", e.target.value)} required />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cole o link da transmissão (YouTube, Twitch, etc)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capacidade e Preço */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Capacidade e Ingresso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="maxAttendees" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Capacidade
                  </Label>
                  <Input id="maxAttendees" type="number" placeholder="300" value={eventData.maxAttendees} onChange={e => handleInputChange("maxAttendees", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="ticketPrice" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Preço (R$)
                  </Label>
                  <Input id="ticketPrice" type="number" step="0.01" placeholder="50.00" value={eventData.ticketPrice} onChange={e => handleInputChange("ticketPrice", e.target.value)} />
                </div>
              </div>
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
                <div className="space-y-1">
                  <Label>Exigir cadastro para participar</Label>
                  <p className="text-xs text-muted-foreground">
                    Participantes precisarão se cadastrar antes do evento
                  </p>
                </div>
                <Switch checked={requiresRegistration} onCheckedChange={setRequiresRegistration} />
              </div>

              {requiresRegistration && <div className="mt-4">
                  <FormBuilder fields={formFields} onChange={setFormFields} />
                </div>}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="space-y-3">
            <Button type="submit" className="w-full btn-glow" disabled={isCreating}>
              {isCreating ? <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Criando Evento...
                </> : 'Criar Evento'}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={onBack}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>;
}