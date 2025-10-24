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
  const [searching, setSearching] = useState(false);
  const { getCurrentPosition, loading } = useGeolocation();

  useEffect(() => {
    if (autoRequestLocation && !locationRequested && !value) {
      setLocationRequested(true);
      handleUseCurrentLocation();
    }
  }, [autoRequestLocation, locationRequested, value]);

  useEffect(() => {
    if (value) {
      loadSelectedCity(value);
    }
  }, [value]);

  useEffect(() => {
    const searchCities = async () => {
      if (searchQuery.trim() === "" || searchQuery.length < 2) {
        setFilteredCities([]);
        return;
      }

      setSearching(true);
      try {
        const query = searchQuery.trim();
        const { data, error } = await supabase
          .from("cities")
          .select("*")
          .or(`name.ilike.%${query}%,state.ilike.%${query}%`)
          .limit(100);

        if (error) throw error;

        // Sort results: prioritize cities that START with the query
        const sorted = (data || []).sort((a, b) => {
          const aStartsWith = a.name.toLowerCase().startsWith(query.toLowerCase());
          const bStartsWith = b.name.toLowerCase().startsWith(query.toLowerCase());

          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;

          return a.name.localeCompare(b.name);
        });

        setFilteredCities(sorted.slice(0, 50));
      } catch (error) {
        console.error("Error searching cities:", error);
      } finally {
        setSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchCities, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);


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
        const { data: matchingCities, error: searchError } = await supabase
          .from("cities")
          .select("*")
          .ilike("name", cityName)
          .limit(1);

        if (searchError) {
          console.error("Error searching city:", searchError);
          toast.error("Erro ao buscar cidade");
          return;
        }

        let matchingCity = matchingCities?.[0];

        if (!matchingCity) {
          const stateName = data.address.state;
          const stateAbbrev = getStateAbbreviation(stateName);

          const { data: newCity, error } = await supabase
            .from("cities")
            .insert({ name: cityName, state: stateAbbrev, country: "Brasil" })
            .select()
            .single();

          if (error) {
            console.error("Error creating city:", error);
            toast.error("Erro ao adicionar cidade");
            return;
          }

          matchingCity = newCity;
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
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{selectedCity.name}, {selectedCity.state}</span>
          <span className="ml-auto text-xs text-primary">✓ Selecionada</span>
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

        {searchQuery && searchQuery.length >= 2 && (
          <ScrollArea className="h-[200px] w-full border rounded-md">
            <div className="p-2 space-y-1">
              {searching ? (
                <p className="text-sm text-muted-foreground p-2">Buscando...</p>
              ) : Object.entries(groupedCities).length === 0 ? (
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
