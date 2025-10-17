import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface City {
  id: string;
  name: string;
  state: string;
  country: string;
}

interface MultiCitySelectProps {
  value: string[];
  onChange: (cityIds: string[]) => void;
  label?: string;
  placeholder?: string;
  description?: string;
}

export function MultiCitySelect({
  value,
  onChange,
  label = "Cidades Visíveis",
  placeholder = "Selecione as cidades",
  description = "Escolha em quais cidades seu conteúdo será visível"
}: MultiCitySelectProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("state")
        .order("name");

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error("Error loading cities:", error);
      toast.error("Erro ao carregar cidades");
    } finally {
      setLoading(false);
    }
  };

  const selectedCities = cities.filter(city => value.includes(city.id));

  const toggleCity = (cityId: string) => {
    if (value.includes(cityId)) {
      onChange(value.filter(id => id !== cityId));
    } else {
      onChange([...value, cityId]);
    }
  };

  const removeCity = (cityId: string) => {
    onChange(value.filter(id => id !== cityId));
  };

  const groupedCities = cities.reduce((acc, city) => {
    if (!acc[city.state]) {
      acc[city.state] = [];
    }
    acc[city.state].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            disabled={loading}
          >
            <MapPin className="mr-2 h-4 w-4" />
            {loading ? "Carregando..." :
             selectedCities.length > 0 ?
             `${selectedCities.length} cidade${selectedCities.length > 1 ? 's' : ''} selecionada${selectedCities.length > 1 ? 's' : ''}` :
             placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <ScrollArea className="h-[300px]">
            <div className="p-4 space-y-4">
              {Object.entries(groupedCities).map(([state, stateCities]) => (
                <div key={state}>
                  <h4 className="mb-2 text-sm font-semibold">{state}</h4>
                  <div className="space-y-2">
                    {stateCities.map((city) => (
                      <div key={city.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={city.id}
                          checked={value.includes(city.id)}
                          onCheckedChange={() => toggleCity(city.id)}
                        />
                        <label
                          htmlFor={city.id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {city.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedCities.map((city) => (
            <Badge key={city.id} variant="secondary" className="pl-2 pr-1">
              {city.name} - {city.state}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => removeCity(city.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
