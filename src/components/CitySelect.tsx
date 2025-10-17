import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface City {
  id: string;
  name: string;
  state: string;
  country: string;
}

interface CitySelectProps {
  value?: string;
  onChange: (cityId: string) => void;
  label?: string;
  placeholder?: string;
}

export function CitySelect({ value, onChange, label = "Cidade", placeholder = "Selecione sua cidade" }: CitySelectProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Carregando..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              {city.name} - {city.state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
