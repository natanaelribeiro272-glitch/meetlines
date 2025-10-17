import { useState, useEffect } from "react";
import { MapPin, Navigation, ChevronDown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface City {
  id: string;
  name: string;
  state: string;
}

export function LocationSelector() {
  const { profile, refetch } = useProfile();
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState<City | null>(null);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (profile?.city_id) {
      loadCurrentCity();
    }
  }, [profile?.city_id]);

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
      const { data: organizersData, error: organizersError } = await supabase
        .from("organizers")
        .select("city_id")
        .not("city_id", "is", null);

      if (organizersError) throw organizersError;

      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("city_id")
        .not("city_id", "is", null);

      if (eventsError) throw eventsError;

      const cityIds = new Set([
        ...(organizersData?.map((o) => o.city_id) || []),
        ...(eventsData?.map((e) => e.city_id) || []),
      ]);

      if (cityIds.size === 0) {
        setCities([]);
        setFilteredCities([]);
        return;
      }

      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .in("id", Array.from(cityIds))
        .order("state")
        .order("name");

      if (error) throw error;
      setCities(data || []);
      setFilteredCities(data || []);
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };

  const loadCurrentCity = async () => {
    if (!profile?.city_id) return;

    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("id", profile.city_id)
        .maybeSingle();

      if (error) throw error;
      setCurrentCity(data);
    } catch (error) {
      console.error("Error loading current city:", error);
    }
  };

  const handleSelectCity = async (city: City) => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ city_id: city.id })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      setCurrentCity(city);
      await refetch();
      toast.success(`Localização alterada para ${city.name}, ${city.state}`);
      setOpen(false);
      setSearchQuery("");
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Erro ao atualizar localização");
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo navegador");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();

          const cityName = data.address.city || data.address.town || data.address.municipality;

          if (cityName) {
            const matchingCity = cities.find(
              (city) => city.name.toLowerCase() === cityName.toLowerCase()
            );

            if (matchingCity) {
              await handleSelectCity(matchingCity);
            } else {
              toast.error("Cidade não encontrada no sistema");
            }
          } else {
            toast.error("Não foi possível identificar sua cidade");
          }
        } catch (error) {
          console.error("Error fetching location:", error);
          toast.error("Erro ao obter localização");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Erro ao acessar localização");
        setLoading(false);
      }
    );
  };

  const handleClearLocation = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ city_id: null })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      setCurrentCity(null);
      await refetch();
      toast.success("Localização removida");
    } catch (error) {
      console.error("Error clearing location:", error);
      toast.error("Erro ao remover localização");
    } finally {
      setLoading(false);
    }
  };

  const groupedCities = filteredCities.reduce((acc, city) => {
    if (!acc[city.state]) {
      acc[city.state] = [];
    }
    acc[city.state].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
      >
        <MapPin className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate max-w-[120px]">
          {currentCity ? currentCity.name : "Qualquer lugar"}
        </span>
        <ChevronDown className="h-3 w-3 flex-shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Localização</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4">
            <Input
              type="text"
              placeholder="Onde?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <ScrollArea className="max-h-[400px] px-6">
            <div className="space-y-2 pb-6">
              <button
                onClick={handleUseCurrentLocation}
                disabled={loading}
                className="w-full flex items-start gap-3 p-3 hover:bg-accent rounded-lg transition-colors text-left group"
              >
                <Navigation className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-medium text-sm">Usar minha localização atual</p>
                  <p className="text-xs text-muted-foreground">
                    Encontre eventos perto de você
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSelectCity({ id: "", name: "Qualquer lugar", state: "" } as City)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors text-left"
              >
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">Qualquer lugar</span>
              </button>

              {Object.entries(groupedCities).map(([state, stateCities]) => (
                <div key={state} className="pt-4 first:pt-2">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-3">
                    {state}
                  </h3>
                  <div className="space-y-1">
                    {stateCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleSelectCity(city)}
                        disabled={loading}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors text-left ${
                          currentCity?.id === city.id ? "bg-accent" : ""
                        }`}
                      >
                        <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{city.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {currentCity && (
            <div className="px-6 pb-6 pt-2 border-t">
              <Button
                variant="outline"
                onClick={handleClearLocation}
                disabled={loading}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Remover localização
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
