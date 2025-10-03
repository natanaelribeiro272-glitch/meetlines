import { useState } from "react";
import { Plus, Trash2, GripVertical, Text, Mail, Phone, Calendar, ToggleLeft, List, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'photo' | 'file';
  label: string;
  required: boolean;
  options?: string[];
}

interface FormFieldsConfigProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const fieldIcons = {
  text: Text,
  email: Mail,
  phone: Phone,
  date: Calendar,
  select: List,
  checkbox: ToggleLeft,
  photo: Image,
  file: FileText,
};

export default function FormFieldsConfig({ fields, onChange }: FormFieldsConfigProps) {
  const [editingField, setEditingField] = useState<string | null>(null);

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'Novo Campo',
      required: false,
    };
    onChange([...fields, newField]);
    setEditingField(newField.id);
  };

  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure os campos que deseja coletar dos participantes
        </p>
        <Button onClick={addField} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Campo
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Text className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum campo personalizado ainda</p>
            <p className="text-xs mt-1">Clique em "Adicionar Campo" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const Icon = fieldIcons[field.type];
            const isEditing = editingField === field.id;

            return (
              <Card key={field.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Tipo do Campo</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateField(field.id, { type: value as FormField['type'] })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Telefone</SelectItem>
                              <SelectItem value="date">Data</SelectItem>
                              <SelectItem value="select">Seleção Única</SelectItem>
                              <SelectItem value="checkbox">Múltipla Escolha</SelectItem>
                              <SelectItem value="photo">Upload de Foto</SelectItem>
                              <SelectItem value="file">Upload de Arquivo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Nome do Campo</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="Ex: Nome completo"
                            className="h-9"
                          />
                        </div>
                      </div>

                      {(field.type === 'select' || field.type === 'checkbox') && (
                        <div>
                          <Label className="text-xs">
                            {field.type === 'select' ? 'Opções (pressione Enter para nova linha)' : 'Opções para selecionar (pressione Enter para nova linha)'}
                          </Label>
                          <textarea
                            value={(field.options || []).join('\n')}
                            onChange={(e) => updateField(field.id, { 
                              options: e.target.value.split('\n').filter(o => o.trim()) 
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                const target = e.currentTarget;
                                const start = target.selectionStart ?? target.value.length;
                                const end = target.selectionEnd ?? target.value.length;
                                const newValue = target.value.slice(0, start) + '\n' + target.value.slice(end);
                                // Update the options with the inserted line break
                                updateField(field.id, {
                                  options: newValue.split('\n').filter(o => o.trim())
                                });
                                // Restore caret position after re-render
                                setTimeout(() => {
                                  try { target.setSelectionRange(start + 1, start + 1); } catch {}
                                }, 0);
                              }
                            }}
                            placeholder={"Digite uma opção e pressione Enter\nSegunda opção\nTerceira opção"}
                            className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y"
                            rows={4}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {field.type === 'checkbox' 
                              ? 'Participante poderá selecionar múltiplas opções' 
                              : 'Participante poderá selecionar apenas uma opção'}
                          </p>
                        </div>
                      )}

                      {field.type === 'photo' && (
                        <div className="rounded-lg border border-border bg-surface/30 p-3">
                          <p className="text-xs text-muted-foreground">
                            <Image className="h-3 w-3 inline mr-1" />
                            Participante poderá enviar uma foto (JPG, PNG, até 5MB)
                          </p>
                        </div>
                      )}

                      {field.type === 'file' && (
                        <div className="rounded-lg border border-border bg-surface/30 p-3">
                          <p className="text-xs text-muted-foreground">
                            <FileText className="h-3 w-3 inline mr-1" />
                            Participante poderá enviar um arquivo (PDF, DOC, até 10MB)
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                          />
                          <Label className="text-xs">Campo obrigatório</Label>
                        </div>
                        <Button onClick={() => setEditingField(null)} size="sm" variant="outline">
                          Concluir
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveField(index, 'up')}
                          disabled={index === 0}
                        >
                          <GripVertical className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveField(index, 'down')}
                          disabled={index === fields.length - 1}
                        >
                          <GripVertical className="h-3 w-3" />
                        </Button>
                      </div>

                      <Icon className="h-4 w-4 text-muted-foreground" />
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium">{field.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {field.type === 'text' && 'Texto'}
                          {field.type === 'email' && 'Email'}
                          {field.type === 'phone' && 'Telefone'}
                          {field.type === 'date' && 'Data'}
                          {field.type === 'select' && 'Seleção Única'}
                          {field.type === 'checkbox' && 'Múltipla Escolha'}
                          {field.type === 'photo' && 'Upload de Foto'}
                          {field.type === 'file' && 'Upload de Arquivo'}
                          {field.required && ' • Obrigatório'}
                          {field.options && field.options.length > 0 && ` • ${field.options.length} opções`}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingField(field.id)}
                        >
                          <Text className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-2">
        <p className="text-xs text-muted-foreground">
          <strong>Dica:</strong> Os campos "Nome", "Email" e "Telefone" já são coletados por padrão. 
          Use campos personalizados para informações adicionais específicas do seu evento.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Text className="h-3 w-3" /> Texto livre
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <List className="h-3 w-3" /> Escolha única
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ToggleLeft className="h-3 w-3" /> Múltiplas opções
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Image className="h-3 w-3" /> Fotos
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" /> Arquivos
          </div>
        </div>
      </div>
    </div>
  );
}