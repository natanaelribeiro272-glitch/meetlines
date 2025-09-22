import { useState } from "react";
import { ArrowLeft, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/FormBuilder";

// Mock form fields data
const mockEventForm: FormField[] = [
  { id: "1", type: "text", label: "Nome Completo", placeholder: "Digite seu nome completo", required: true },
  { id: "2", type: "email", label: "E-mail", placeholder: "seu@email.com", required: true },
  { id: "3", type: "phone", label: "Telefone", placeholder: "(11) 99999-9999", required: true },
  { id: "4", type: "select", label: "Como soube do evento?", required: false, options: ["Instagram", "Facebook", "Amigos", "Site", "Outros"] },
  { id: "5", type: "file", label: "Foto para Identificação", required: false },
  { id: "6", type: "textarea", label: "Observações", placeholder: "Alguma informação adicional...", required: false }
];

interface EventRegistrationProps {
  onBack: () => void;
  eventId?: string;
}

export default function EventRegistration({ onBack, eventId }: EventRegistrationProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    console.log("Cadastro realizado:", formData);
    setIsSubmitted(true);
  };

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
          <h2 className="text-xl font-bold mb-2">Festival Eletrônico 2024</h2>
          <p className="text-muted-foreground text-sm">
            Preencha os dados abaixo para confirmar sua presença no evento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mockEventForm.map((field) => (
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
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                    />
                  )}

                  {field.type === "email" && (
                    <Input
                      type="email"
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                    />
                  )}

                  {field.type === "phone" && (
                    <Input
                      type="tel"
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                    />
                  )}

                  {field.type === "textarea" && (
                    <Textarea
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                      rows={3}
                    />
                  )}

                  {field.type === "select" && (
                    <Select value={formData[field.id] || ""} onValueChange={(value) => handleInputChange(field.id, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option, index) => (
                          <SelectItem key={index} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === "file" && (
                    <div className="space-y-2">
                      {uploadedFiles[field.id] ? (
                        <div className="relative">
                          <img
                            src={uploadedFiles[field.id]}
                            alt="Arquivo enviado"
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
                          <span className="text-sm text-muted-foreground">Clique para enviar</span>
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
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="pt-4">
            <Button type="submit" className="w-full btn-glow">
              Confirmar Cadastro
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}