import { useState, useEffect } from "react";
import { ArrowLeft, Upload, MapPin, Calendar, Clock, Users, DollarSign, FileText, Heart, Eye, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import RegistrationFormDialog from "@/components/RegistrationFormDialog";
import TicketConfiguration from "@/components/TicketConfiguration";
import EventCreatedDialog from "@/components/EventCreatedDialog";
import { FormField } from "@/components/FormFieldsConfig";
import { MultiCategorySelect } from "@/components/MultiCategorySelect";
import { useOrganizer } from "@/hooks/useOrganizer";
import { useProfile } from "@/hooks/useProfile";
import { useAdmin } from "@/hooks/useAdmin";
import { usePlatformDetection } from "@/hooks/usePlatformDetection";
import PlatformRestrictedFeatureAlert from "@/components/PlatformRestrictedFeatureAlert";
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
interface CreateEventProps {
  onBack: () => void;
  eventId?: string; // Para edição futura
}
export default function CreateEvent({
  onBack,
  eventId
}: CreateEventProps) {
  const {
    createEvent,
    organizerData
  } = useOrganizer();
  const {
    profile,
    updateProfile
  } = useProfile();
  const { isAdmin } = useAdmin();
  const { isNativeApp } = usePlatformDetection();
  const [isEditMode, setIsEditMode] = useState(false);
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    endDate: "",
    endTime: "",
    location: "",
    address: "",
    locationLink: "",
    maxAttendees: "",
    ticketPrice: "",
    ticketLink: ""
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreatedDialog, setShowCreatedDialog] = useState(false);
  const [createdEventData, setCreatedEventData] = useState<{ id: string; title: string; shareUrl: string } | null>(null);
  const navigate = useNavigate();
  const [selectedInterest, setSelectedInterest] = useState<string>("");
  const [publicNotes, setPublicNotes] = useState(profile?.notes || "");
  const [notesVisible, setNotesVisible] = useState(true);
  const [eventType, setEventType] = useState<"presencial" | "live">("presencial");
  const [paymentType, setPaymentType] = useState<"free" | "external" | "platform">("free");
  
  // Ticket configuration states
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [ticketSettings, setTicketSettings] = useState({
    feePayer: "buyer" as "buyer" | "organizer",
    platformFeePercentage: 5,
    paymentProcessingFeePercentage: 3.99,
    paymentProcessingFeeFixed: 0.39,
    cancellationPolicy: "",
    acceptsPix: true,
    acceptsCreditCard: true,
    acceptsDebitCard: true,
    maxInstallments: 12
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPlatformAlert, setShowPlatformAlert] = useState(false);
  
  // Payment data states
  const [pixKey, setPixKey] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountType, setBankAccountType] = useState<"corrente" | "poupanca">("corrente");
  const [bankAgency, setBankAgency] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankDocument, setBankDocument] = useState("");
  
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
            
            // Parse end date and time if exists
            let endDateStr = "";
            let endTimeStr = "";
            if (data.end_date) {
              const endDate = new Date(data.end_date);
              endDateStr = endDate.toISOString().split('T')[0];
              endTimeStr = endDate.toTimeString().slice(0, 5);
            }
            
            setEventData({
              title: data.title || "",
              description: data.description || "",
              date: dateStr,
              time: timeStr,
              endDate: endDateStr,
              endTime: endTimeStr,
              location: data.location || "",
              address: data.is_live ? "" : data.location || "",
              locationLink: data.location_link || "",
              maxAttendees: data.max_attendees?.toString() || "",
              ticketPrice: "",
              ticketLink: ""
            });
            
            setSelectedCategories(data.category || []);
            
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
    if (!eventData.title || !eventData.date || !eventData.time || !eventData.endDate || !eventData.endTime) {
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
    
    // Validação de venda na plataforma
    if (paymentType === "platform") {
      if (isNativeApp) {
        toast.error('Venda pela plataforma disponível apenas no navegador');
        setShowPlatformAlert(true);
        return;
      }

      if (ticketTypes.length === 0) {
        toast.error('Configure pelo menos um tipo de ingresso');
        return;
      }
      if (!termsAccepted) {
        toast.error('Você precisa aceitar os termos e condições');
        return;
      }
      // Validar dados de pagamento
      if (!pixKey && (!bankName || !bankAgency || !bankAccount || !bankAccountHolder || !bankDocument)) {
        toast.error('Preencha sua chave PIX ou dados bancários completos para receber os pagamentos');
        return;
      }
    }
    
    if (paymentType === "external" && !eventData.ticketLink) {
      toast.error('Preencha o link de compra do ingresso');
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
      
      // Combine end date and time (obrigatório)
      const eventEndDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);

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
            end_date: eventEndDateTime.toISOString(),
            location: eventType === "live" ? "Online" : eventData.address,
            location_link: eventData.locationLink || null,
            image_url: imageUrl || eventImage,
            max_attendees: eventData.maxAttendees ? parseInt(eventData.maxAttendees) : null,
            interests: selectedInterest ? [selectedInterest] : [],
            is_live: eventType === "live",
            requires_registration: requiresRegistration,
            category: selectedCategories.length > 0 ? selectedCategories : null,
            ticket_price: eventData.ticketPrice ? parseFloat(eventData.ticketPrice) : 0,
            ticket_link: eventData.ticketLink || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId);
        
        if (updateError) throw updateError;
        toast.success('Evento atualizado com sucesso!');
      } else {
        // Create new event
        const eventPayload = {
          title: eventData.title,
          description: eventData.description,
          event_date: eventDateTime.toISOString(),
          end_date: eventEndDateTime.toISOString(),
          location: eventType === "live" ? "Online" : eventData.address,
          location_link: eventData.locationLink || null,
          image_url: imageUrl,
          max_attendees: eventData.maxAttendees ? parseInt(eventData.maxAttendees) : null,
          interests: selectedInterest ? [selectedInterest] : [],
          is_live: eventType === "live",
          status: 'upcoming' as const,
          requires_registration: requiresRegistration,
          category: selectedCategories.length > 0 ? selectedCategories : null,
          form_fields: requiresRegistration ? formFields : [],
          ticket_price: paymentType === "external" && eventData.ticketPrice ? parseFloat(eventData.ticketPrice) : 0,
          ticket_link: paymentType === "external" ? eventData.ticketLink || null : null,
          has_platform_tickets: paymentType === "platform",
          ...(paymentType === "platform" && {
            pix_key: pixKey || null,
            bank_name: bankName || null,
            bank_account_type: bankAccountType || null,
            bank_agency: bankAgency || null,
            bank_account: bankAccount || null,
            bank_account_holder: bankAccountHolder || null,
            bank_document: bankDocument || null
          })
        };

        await createEvent(eventPayload);

        // Get the organizer_id to query the newly created event
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: organizer } = await supabase
          .from('organizers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!organizer) throw new Error('Organizer not found');

        // Get the newly created event
        const { data: newEvent } = await supabase
          .from('events')
          .select('id')
          .eq('organizer_id', organizer.id)
          .eq('title', eventData.title)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Generate share URL
        const slugify = (text: string) =>
          text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();

        const organizerSlug = organizerData?.username ||
                              (organizerData?.page_title ? slugify(organizerData.page_title) : '') ||
                              (profile?.display_name ? slugify(profile.display_name) : 'organizador');
        const eventSlug = slugify(eventData.title);
        const shareUrl = `${window.location.origin}/${organizerSlug}/${eventSlug}`;

        // Show success dialog
        setCreatedEventData({
          id: newEvent.id,
          title: eventData.title,
          shareUrl: shareUrl
        });
        setShowCreatedDialog(true);

        // If platform payment is enabled, save ticket configuration
        if (paymentType === "platform" && newEvent) {
          // Save ticket settings
          const { error: settingsError } = await supabase
            .from('event_ticket_settings')
            .insert({
              event_id: newEvent.id,
              accepts_platform_payment: true,
              fee_payer: ticketSettings.feePayer,
              platform_fee_percentage: ticketSettings.platformFeePercentage,
              payment_processing_fee_percentage: ticketSettings.paymentProcessingFeePercentage,
              payment_processing_fee_fixed: ticketSettings.paymentProcessingFeeFixed,
              cancellation_policy: ticketSettings.cancellationPolicy,
              accepts_pix: ticketSettings.acceptsPix,
              accepts_credit_card: ticketSettings.acceptsCreditCard,
              accepts_debit_card: ticketSettings.acceptsDebitCard,
              max_installments: ticketSettings.maxInstallments,
              terms_accepted: termsAccepted,
              terms_accepted_at: new Date().toISOString()
            });

          if (settingsError) throw settingsError;

          // Save ticket types
          const ticketTypesData = ticketTypes.map((ticket, index) => ({
            event_id: newEvent.id,
            name: ticket.name,
            description: ticket.description,
            price: ticket.price,
            quantity: ticket.quantity,
            sales_start_date: ticket.salesStartDate && ticket.salesStartTime 
              ? new Date(`${ticket.salesStartDate}T${ticket.salesStartTime}`).toISOString()
              : null,
            sales_end_date: ticket.salesEndDate && ticket.salesEndTime
              ? new Date(`${ticket.salesEndDate}T${ticket.salesEndTime}`).toISOString()
              : null,
            min_quantity_per_purchase: ticket.minQuantity,
            max_quantity_per_purchase: ticket.maxQuantity,
            sort_order: index
          }));

          const { error: ticketsError } = await supabase
            .from('ticket_types')
            .insert(ticketTypesData);

          if (ticketsError) throw ticketsError;
        }
      }

      // Don't call onBack() anymore, let the dialog handle navigation
      if (isEditMode) {
        onBack();
      }
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
                <Label htmlFor="category">Categorias</Label>
                <MultiCategorySelect 
                  value={selectedCategories}
                  onChange={setSelectedCategories}
                  placeholder="Selecione uma ou mais categorias"
                />
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
                    <Label htmlFor="date" className="text-xs text-muted-foreground">Data</Label>
                    <Input id="date" type="date" value={eventData.date} onChange={e => handleInputChange("date", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-xs text-muted-foreground">Horário</Label>
                    <Input id="time" type="time" value={eventData.time} onChange={e => handleInputChange("time", e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-sm font-medium mb-2 block">Encerramento do Evento *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="endDate" className="text-xs text-muted-foreground">Data</Label>
                    <Input id="endDate" type="date" value={eventData.endDate} onChange={e => handleInputChange("endDate", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-xs text-muted-foreground">Horário</Label>
                    <Input id="endTime" type="time" value={eventData.endTime} onChange={e => handleInputChange("endTime", e.target.value)} required />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Data e hora em que o evento será encerrado automaticamente
                </p>
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

          {/* Capacidade e Venda de Ingressos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Capacidade e Ingressos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxAttendees" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Capacidade Máxima
                </Label>
                <Input id="maxAttendees" type="number" placeholder="300" value={eventData.maxAttendees} onChange={e => handleInputChange("maxAttendees", e.target.value)} />
              </div>

              <Separator />

              <div>
                <Label className="mb-2 block">Tipo de Ingresso</Label>
                <RadioGroup
                  value={paymentType}
                  onValueChange={(value: "free" | "external" | "platform") => {
                    if (value === "platform" && isNativeApp) {
                      setShowPlatformAlert(true);
                      toast.info('Esta opção está disponível apenas no navegador');
                      return;
                    }
                    setPaymentType(value);
                    setShowPlatformAlert(false);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free" id="free" />
                    <Label htmlFor="free" className="cursor-pointer">
                      🎫 Evento Gratuito
                    </Label>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="external" id="external" />
                      <Label htmlFor="external" className="cursor-pointer">
                        🔗 Link Externo (Sympla, Eventbrite, etc)
                      </Label>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="platform" id="platform" disabled={isNativeApp} />
                    <Label htmlFor="platform" className={isNativeApp ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                      💳 Vender pela plataforma {isNativeApp && "🔒"}
                    </Label>
                  </div>
                </RadioGroup>
                {isNativeApp && (
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 A venda pela plataforma está disponível apenas no navegador web
                  </p>
                )}
              </div>

              {/* Platform Alert */}
              {showPlatformAlert && isNativeApp && (
                <div className="pt-4">
                  <PlatformRestrictedFeatureAlert />
                </div>
              )}

              {/* Link Externo */}
              {paymentType === "external" && isAdmin && (
                <div className="pt-2 border-t">
                  <Label htmlFor="ticketLink">Link de Compra do Ingresso</Label>
                  <Input
                    id="ticketLink"
                    type="url"
                    placeholder="https://www.sympla.com.br/..."
                    value={eventData.ticketLink}
                    onChange={e => handleInputChange("ticketLink", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cole o link onde os participantes podem comprar o ingresso
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados Bancários para Recebimento */}
          {paymentType === "platform" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dados para Recebimento</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Informe seus dados para receber os valores das vendas
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-400 font-medium">
                    💰 Os valores serão transferidos em até 3 dias úteis após a finalização do evento
                  </p>
                </div>

                <div>
                  <Label htmlFor="pixKey">Chave PIX</Label>
                  <Input
                    id="pixKey"
                    placeholder="Digite sua chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recomendado: mais rápido e prático
                  </p>
                </div>

                <Separator />
                
                <p className="text-sm font-medium">Ou informe seus dados bancários</p>

                <div>
                  <Label htmlFor="bankName">Banco</Label>
                  <Input
                    id="bankName"
                    placeholder="Ex: Banco do Brasil, Nubank, Itaú..."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Tipo de Conta</Label>
                  <RadioGroup
                    value={bankAccountType}
                    onValueChange={(value: "corrente" | "poupanca") => setBankAccountType(value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="corrente" id="corrente" />
                      <Label htmlFor="corrente" className="cursor-pointer">
                        Conta Corrente
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="poupanca" id="poupanca" />
                      <Label htmlFor="poupanca" className="cursor-pointer">
                        Conta Poupança
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="bankAgency">Agência</Label>
                    <Input
                      id="bankAgency"
                      placeholder="0001"
                      value={bankAgency}
                      onChange={(e) => setBankAgency(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Conta</Label>
                    <Input
                      id="bankAccount"
                      placeholder="12345-6"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bankAccountHolder">Titular da Conta</Label>
                  <Input
                    id="bankAccountHolder"
                    placeholder="Nome completo do titular"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="bankDocument">CPF/CNPJ do Titular</Label>
                  <Input
                    id="bankDocument"
                    placeholder="000.000.000-00"
                    value={bankDocument}
                    onChange={(e) => setBankDocument(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuração de Venda na Plataforma */}
          {paymentType === "platform" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configuração de Venda</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure os tipos de ingressos, preços e formas de pagamento
                </p>
              </CardHeader>
              <CardContent>
                <TicketConfiguration
                  ticketTypes={ticketTypes}
                  ticketSettings={ticketSettings}
                  onTicketTypesChange={setTicketTypes}
                  onTicketSettingsChange={setTicketSettings}
                  termsAccepted={termsAccepted}
                  onTermsAccepted={setTermsAccepted}
                  organizerId={organizerData?.id || ''}
                  eventId={eventId}
                />
              </CardContent>
            </Card>
          )}

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

              {requiresRegistration && (
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full"
                  onClick={() => setFormDialogOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Campos do Formulário {formFields.length > 0 && `(${formFields.length} campos)`}
                </Button>
              )}
            </CardContent>
          </Card>

          <RegistrationFormDialog
            open={formDialogOpen}
            onOpenChange={setFormDialogOpen}
            fields={formFields}
            onSave={setFormFields}
          />

          {createdEventData && (
            <EventCreatedDialog
              open={showCreatedDialog}
              onOpenChange={setShowCreatedDialog}
              eventId={createdEventData.id}
              eventTitle={createdEventData.title}
              shareUrl={createdEventData.shareUrl}
              onViewEvent={() => {
                setShowCreatedDialog(false);
                navigate(`/e/${createdEventData.id}`);
              }}
            />
          )}

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