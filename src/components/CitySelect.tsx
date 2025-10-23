import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/useGeolocation";

interface City {
  id: string;
  name: string;
  state: string;
}

interface CitySelectProps {
  value?: string;
  onChange: (cityId: string, cityName: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  showUseLocation?: boolean;
  autoRequestLocation?: boolean;
}

export function CitySelect({
  value,
  onChange,
  label = "Cidade",
  placeholder = "Buscar cidade...",
  required = false,
  showUseLocation = true,
  autoRequestLocation = false
}: CitySelectProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const { getCurrentPosition, loading } = useGeolocation();

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (autoRequestLocation && !locationRequested && !value && cities.length > 0) {
      setLocationRequested(true);
      handleUseCurrentLocation();
    }
  }, [autoRequestLocation, locationRequested, value, cities]);

  useEffect(() => {
    if (value) {
      loadSelectedCity(value);
    }
  }, [value]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCities(cities);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = cities.filter(
        (city) =>
          city.name.toLowerCase().includes(query) ||
          city.state.toLowerCase().includes(query)
      );
      setFilteredCities(filtered);
    }
  }, [searchQuery, cities]);

  const loadCities = async () => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("state")
        .order("name");

      if (error) throw error;
      setCities(data || []);
      setFilteredCities(data || []);
    } catch (error) {
      console.error("Error loading cities:", error);
      toast.error("Erro ao carregar cidades");
    }
  };

  const loadSelectedCity = async (cityId: string) => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("id", cityId)
        .maybeSingle();

      if (error) throw error;
      setSelectedCity(data);
    } catch (error) {
      console.error("Error loading selected city:", error);
    }
  };

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    onChange(city.id, city.name);
    setSearchQuery("");
  };

  const handleUseCurrentLocation = async () => {
    const position = await getCurrentPosition();

    if (!position) {
      toast.error("Não foi possível obter sua localização");
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${position.lat}&lon=${position.lon}&format=json`
      );
      const data = await response.json();

      const cityName = data.address.city || data.address.town || data.address.municipality;

      if (cityName) {
        let matchingCity = cities.find(
          (city) => city.name.toLowerCase() === cityName.toLowerCase()
        );

        if (!matchingCity) {
          const stateName = data.address.state;
          const stateAbbrev = getStateAbbreviation(stateName);

          const { data: newCity, error } = await supabase
            .from("cities")
            .insert({ name: cityName, state: stateAbbrev })
            .select()
            .single();

          if (error) {
            console.error("Error creating city:", error);
            toast.error("Erro ao adicionar cidade");
            return;
          }

          matchingCity = newCity;
          setCities([...cities, newCity]);
        }

        if (matchingCity) {
          handleSelectCity(matchingCity);
          toast.success(`Localização detectada: ${matchingCity.name}`);
        }
      } else {
        toast.error("Não foi possível identificar sua cidade");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      toast.error("Erro ao obter localização");
    }
  };

  const getStateAbbreviation = (stateName: string): string => {
    const stateMap: Record<string, string> = {
      "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
      "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
      "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
      "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
      "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
      "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
      "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO"
    };

    return stateMap[stateName] || "BR";
  };

  const groupedCities = filteredCities.reduce((acc, city) => {
    if (!acc[city.state]) {
      acc[city.state] = [];
    }
    acc[city.state].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  return (
    <div className="space-y-3">
      <Label htmlFor="city">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      {showUseLocation && (
        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={loading}
          className="w-full justify-start"
        >
          <Navigation className="h-4 w-4 mr-2 text-primary" />
          {loading ? "Detectando localização..." : "Usar minha localização atual"}
        </Button>
      )}

      {selectedCity && (
        <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{selectedCity.name}, {selectedCity.state}</span>
        </div>
      )}

      <div className="space-y-2">
        <Input
          id="city"
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {(!selectedCity || searchQuery) && (
          <ScrollArea className="h-[200px] w-full border rounded-md">
            <div className="p-2 space-y-1">
              {Object.entries(groupedCities).length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">Nenhuma cidade encontrada</p>
              ) : (
                Object.entries(groupedCities).map(([state, stateCities]) => (
                  <div key={state} className="mb-3">
                    <h3 className="text-xs font-semibold text-muted-foreground mb-1 px-2">
                      {state}
                    </h3>
                    {stateCities.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {required && !selectedCity && (
        <p className="text-xs text-muted-foreground">
          Selecione sua cidade para que os usuários possam encontrar seus eventos
        </p>
      )}
    </div>
  );
}
