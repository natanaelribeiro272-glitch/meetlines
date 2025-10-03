import { useState, useEffect } from "react";
import { ArrowLeft, Upload, Check, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface EventRegistrationProps {
  onBack: () => void;
  eventId?: string;
}

export default function EventRegistration({ onBack, eventId }: EventRegistrationProps) {
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    email: user?.email || '',
    phone: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFileUpload = (fieldId: string, file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedFiles(prev => ({ ...prev, [fieldId]: result }));
        handleInputChange(fieldId, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !eventId) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      setIsSubmitting(true);

      // Preparar dados customizados
      const customData: Record<string, any> = {};
      const formFields = (event?.form_fields as any[]) || [];
      
      formFields.forEach(field => {
        if (formData[field.id]) {
          customData[field.label] = formData[field.id];
        }
      });

      // Criar registro
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          user_name: formData.name,
          user_email: formData.email,
          user_phone: formData.phone || null,
          registration_data: customData,
          status: 'confirmed'
        });

      if (error) throw error;

      toast.success('Cadastro realizado com sucesso!');
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      if (error.code === '23505') {
        toast.error('Você já está cadastrado neste evento');
      } else {
        toast.error('Erro ao realizar cadastro');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Evento não encontrado</p>
            <Button onClick={onBack} className="mt-4">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Cadastro Realizado!</h2>
            <p className="text-muted-foreground">
              Seu cadastro foi enviado com sucesso. Você receberá um e-mail de confirmação em breve.
            </p>
            <Button onClick={onBack} className="w-full">
              Voltar ao Evento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Cadastro no Evento</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto pb-20">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">{event.title}</h2>
          <p className="text-muted-foreground text-sm">
            Preencha os dados abaixo para confirmar sua presença no evento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campos padrão */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label>Nome Completo <span className="text-destructive">*</span></Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Campos personalizados */}
          {event.form_fields && Array.isArray(event.form_fields) && event.form_fields.length > 0 && (
            <>
              {event.form_fields.map((field: any) => (
                <Card key={field.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-destructive">*</span>}
                      </Label>

                      {field.type === "text" && (
                        <Input
                          type="text"
                          value={formData[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          required={field.required}
                        />
                      )}

                      {field.type === "email" && (
                        <Input
                          type="email"
                          value={formData[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          required={field.required}
                        />
                      )}

                      {field.type === "phone" && (
                        <Input
                          type="tel"
                          value={formData[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          required={field.required}
                        />
                      )}

                      {field.type === "date" && (
                        <Input
                          type="date"
                          value={formData[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          required={field.required}
                        />
                      )}

                      {field.type === "select" && (
                        <Select 
                          value={formData[field.id] || ""} 
                          onValueChange={(value) => handleInputChange(field.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma opção" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option: string, index: number) => (
                              <SelectItem key={index} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {field.type === "checkbox" && (
                        <div className="space-y-2">
                          {field.options?.map((option: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <Checkbox
                                id={`${field.id}-${index}`}
                                checked={(formData[field.id] || []).includes(option)}
                                onCheckedChange={(checked) => {
                                  const current = formData[field.id] || [];
                                  const updated = checked
                                    ? [...current, option]
                                    : current.filter((o: string) => o !== option);
                                  handleInputChange(field.id, updated);
                                }}
                              />
                              <Label htmlFor={`${field.id}-${index}`} className="font-normal cursor-pointer">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}

                      {field.type === "photo" && (
                        <div className="space-y-2">
                          {uploadedFiles[field.id] ? (
                            <div className="relative">
                              <img
                                src={uploadedFiles[field.id]}
                                alt="Foto enviada"
                                className="w-full h-32 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  setUploadedFiles(prev => ({ ...prev, [field.id]: "" }));
                                  handleInputChange(field.id, "");
                                }}
                              >
                                Remover
                              </Button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded cursor-pointer hover:border-primary/50 transition-colors">
                              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                              <span className="text-sm text-muted-foreground">Enviar Foto</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(field.id, file);
                                }}
                                className="hidden"
                                required={field.required}
                              />
                            </label>
                          )}
                        </div>
                      )}

                      {field.type === "file" && (
                        <div className="space-y-2">
                          <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded cursor-pointer hover:border-primary/50 transition-colors">
                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                            <span className="text-sm text-muted-foreground">
                              {formData[field.id] || "Enviar Arquivo"}
                            </span>
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleInputChange(field.id, file.name);
                                }
                              }}
                              className="hidden"
                              required={field.required}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          <div className="pt-4">
            <Button type="submit" className="w-full btn-glow" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Confirmar Cadastro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}