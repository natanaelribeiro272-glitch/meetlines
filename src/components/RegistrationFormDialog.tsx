import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FormFieldsConfig, { FormField } from "@/components/FormFieldsConfig";
import { FileText } from "lucide-react";

interface RegistrationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: FormField[];
  onSave: (fields: FormField[]) => void;
}

export default function RegistrationFormDialog({
  open,
  onOpenChange,
  fields,
  onSave,
}: RegistrationFormDialogProps) {
  const [localFields, setLocalFields] = useState<FormField[]>(fields);

  const handleSave = () => {
    onSave(localFields);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configurar Formulário de Cadastro
          </DialogTitle>
          <DialogDescription>
            Personalize os campos que serão coletados dos participantes do evento.
            Nome, email e telefone já são campos padrão.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <FormFieldsConfig fields={localFields} onChange={setLocalFields} />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Formulário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}