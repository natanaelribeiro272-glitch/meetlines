import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const EVENT_CATEGORIES = [
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

interface MultiCategorySelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiCategorySelect({ value, onChange, placeholder = "Selecione categorias..." }: MultiCategorySelectProps) {
  const selectedCategories = value || [];

  const toggleCategory = (categoryValue: string) => {
    if (selectedCategories.includes(categoryValue)) {
      onChange(selectedCategories.filter(v => v !== categoryValue));
    } else {
      onChange([...selectedCategories, categoryValue]);
    }
  };

  const removeCategory = (categoryValue: string) => {
    onChange(selectedCategories.filter(v => v !== categoryValue));
  };

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between"
          >
            {selectedCategories.length > 0 ? (
              <span>{selectedCategories.length} categoria{selectedCategories.length > 1 ? 's' : ''} selecionada{selectedCategories.length > 1 ? 's' : ''}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar categoria..." />
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {EVENT_CATEGORIES.map((category) => (
                <CommandItem
                  key={category.value}
                  onSelect={() => toggleCategory(category.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCategories.includes(category.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected categories badges */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((categoryValue) => {
            const category = EVENT_CATEGORIES.find(c => c.value === categoryValue);
            if (!category) return null;
            
            return (
              <Badge key={categoryValue} variant="secondary" className="gap-1">
                {category.label}
                <button
                  type="button"
                  onClick={() => removeCategory(categoryValue)}
                  className="ml-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}