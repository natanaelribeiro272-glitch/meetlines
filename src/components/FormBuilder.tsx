import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "select" | "textarea" | "file";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export default function FormBuilder({ fields, onChange }: FormBuilderProps) {
  const [editingField, setEditingField] = useState<string | null>(null);

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "Novo Campo",
      placeholder: "",
      required: false,
    };
    onChange([...fields, newField]);
    setEditingField(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    onChange(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const removeField = (fieldId: string) => {
    onChange(fields.filter(field => field.id !== fieldId));
  };

  const moveField = (fieldId: string, direction: "up" | "down") => {
    const currentIndex = fields.findIndex(field => field.id === fieldId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === fields.length - 1)
    ) return;

    const newFields = [...fields];
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    [newFields[currentIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[currentIndex]];
    onChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Formulário de Cadastro</h3>
        <Button onClick={addField} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Campo
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum campo adicionado ainda. Clique em "Adicionar Campo" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <CardTitle className="text-sm">{field.label}</CardTitle>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {field.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveField(field.id, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveField(field.id, "down")}
                      disabled={index === fields.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {editingField === field.id && (
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo do Campo</Label>
                      <Select value={field.type} onValueChange={(value) => updateField(field.id, { type: value as FormField["type"] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                          <SelectItem value="textarea">Texto Longo</SelectItem>
                          <SelectItem value="select">Seleção</SelectItem>
                          <SelectItem value="file">Arquivo/Foto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                      />
                      <Label>Obrigatório</Label>
                    </div>
                  </div>

                  <div>
                    <Label>Rótulo do Campo</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Ex: Nome Completo"
                    />
                  </div>

                  {field.type !== "file" && field.type !== "select" && (
                    <div>
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder || ""}
                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                        placeholder="Ex: Digite seu nome..."
                      />
                    </div>
                  )}

                  {field.type === "select" && (
                    <div>
                      <Label>Opções (uma por linha)</Label>
                      <textarea
                        className="w-full min-h-[80px] p-2 border border-border rounded-md text-sm"
                        value={field.options?.join("\n") || ""}
                        onChange={(e) => updateField(field.id, { options: e.target.value.split("\n").filter(Boolean) })}
                        placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                      />
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}