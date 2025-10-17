import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Filter, MapPin, Calendar, X } from "lucide-react";

interface City {
  id: string;
  name: string;
  state: string;
}

export interface EventFilters {
  cities: string[];
  categories: string[];
  dateRange: 'all' | 'today' | 'week' | 'month';
  showAllCities: boolean;
}

interface EventFiltersDialogProps {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
  userCityId?: string;
}

export function EventFiltersDialog({ filters, onChange, userCityId }: EventFiltersDialogProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<EventFilters>(filters);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters, open]);

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
    } finally {
      setLoading(false);
    }
  };

  const toggleCity = (cityId: string) => {
    const newCities = tempFilters.cities.includes(cityId)
      ? tempFilters.cities.filter(id => id !== cityId)
      : [...tempFilters.cities, cityId];

    setTempFilters({
      ...tempFilters,
      cities: newCities,
      showAllCities: false
    });
  };

  const handleShowAllCities = () => {
    setTempFilters({
      ...tempFilters,
      cities: [],
      showAllCities: true
    });
  };

  const handleShowMyCity = () => {
    if (userCityId) {
      setTempFilters({
        ...tempFilters,
        cities: [userCityId],
        showAllCities: false
      });
    }
  };

  const applyFilters = () => {
    onChange(tempFilters);
    setOpen(false);
  };

  const clearFilters = () => {
    const clearedFilters: EventFilters = {
      cities: userCityId ? [userCityId] : [],
      categories: [],
      dateRange: 'all',
      showAllCities: false
    };
    setTempFilters(clearedFilters);
    onChange(clearedFilters);
    setOpen(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.cities.length > 0 || filters.showAllCities) count++;
    if (filters.dateRange !== 'all') count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();
  const groupedCities = cities.reduce((acc, city) => {
    if (!acc[city.state]) {
      acc[city.state] = [];
    }
    acc[city.state].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 relative">
          <Filter className="h-4 w-4" />
          {activeCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </SheetTitle>
          <SheetDescription>
            Personalize sua busca de eventos
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Filtro de Localização */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </Label>
              </div>

              <div className="space-y-2">
                <Button
                  variant={tempFilters.cities.length === 1 && tempFilters.cities[0] === userCityId ? "default" : "outline"}
                  size="sm"
                  onClick={handleShowMyCity}
                  disabled={!userCityId}
                  className="w-full justify-start"
                >
                  Minha cidade
                </Button>
                <Button
                  variant={tempFilters.showAllCities ? "default" : "outline"}
                  size="sm"
                  onClick={handleShowAllCities}
                  className="w-full justify-start"
                >
                  Todas as cidades
                </Button>
              </div>

              {!loading && (
                <div className="space-y-3 mt-4">
                  {Object.entries(groupedCities).map(([state, stateCities]) => (
                    <div key={state}>
                      <h4 className="text-sm font-semibold mb-2">{state}</h4>
                      <div className="space-y-2 pl-2">
                        {stateCities.map((city) => (
                          <div key={city.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`city-${city.id}`}
                              checked={tempFilters.cities.includes(city.id)}
                              onCheckedChange={() => toggleCity(city.id)}
                            />
                            <label
                              htmlFor={`city-${city.id}`}
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
              )}
            </div>

            {/* Filtro de Data */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período
              </Label>
              <RadioGroup
                value={tempFilters.dateRange}
                onValueChange={(value: any) => setTempFilters({ ...tempFilters, dateRange: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <label htmlFor="all" className="text-sm cursor-pointer">
                    Todos os períodos
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="today" id="today" />
                  <label htmlFor="today" className="text-sm cursor-pointer">
                    Hoje
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="week" id="week" />
                  <label htmlFor="week" className="text-sm cursor-pointer">
                    Esta semana
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="month" id="month" />
                  <label htmlFor="month" className="text-sm cursor-pointer">
                    Este mês
                  </label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={clearFilters} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button onClick={applyFilters} className="flex-1">
              Aplicar
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
