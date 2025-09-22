import { useState } from "react";
import { ArrowLeft, Search, Star, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Organizer {
  id: string;
  name: string;
  bio: string;
  followers: number;
  events: number;
  rating: number;
  category: string;
  avatar?: string;
  verified: boolean;
}

interface OrganizersListProps {
  onBack: () => void;
  onOrganizerClick: (organizerId: string) => void;
}

export default function OrganizersList({ onBack, onOrganizerClick }: OrganizersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  const organizers: Organizer[] = [
    {
      id: "1",
      name: "Electronic Vibes",
      bio: "Criando experiências únicas em música eletrônica desde 2019",
      followers: 1250,
      events: 15,
      rating: 4.8,
      category: "Eletrônica",
      verified: true,
    },
    {
      id: "2",
      name: "Rock Nights SP",
      bio: "As melhores bandas de rock alternativo da cidade",
      followers: 980,
      events: 22,
      rating: 4.6,
      category: "Rock",
      verified: true,
    },
    {
      id: "3",
      name: "Pop Culture Events",
      bio: "Shows e eventos de pop nacional e internacional",
      followers: 2100,
      events: 31,
      rating: 4.9,
      category: "Pop",
      verified: false,
    },
    {
      id: "4",
      name: "Underground Hip Hop",
      bio: "Cultura hip hop e rap underground paulistano",
      followers: 850,
      events: 18,
      rating: 4.7,
      category: "Hip-Hop",
      verified: true,
    },
    {
      id: "5",
      name: "Jazz & Blues Collective",
      bio: "Noites de jazz e blues com os melhores músicos",
      followers: 650,
      events: 12,
      rating: 4.5,
      category: "Jazz",
      verified: false,
    },
    {
      id: "6",
      name: "Sertanejo Premium",
      bio: "Sertanejo universitário e raiz com qualidade premium",
      followers: 1800,
      events: 28,
      rating: 4.4,
      category: "Sertanejo",
      verified: true,
    },
  ];

  const categories = [
    { id: "todos", label: "Todos" },
    { id: "Eletrônica", label: "Eletrônica" },
    { id: "Rock", label: "Rock" },
    { id: "Pop", label: "Pop" },
    { id: "Hip-Hop", label: "Hip-Hop" },
    { id: "Jazz", label: "Jazz" },
    { id: "Sertanejo", label: "Sertanejo" },
  ];

  const filteredOrganizers = organizers.filter(organizer => {
    const matchesSearch = organizer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         organizer.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "todos" || organizer.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-muted-foreground"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Organizadores</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto pb-20">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar organizadores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Organizers List */}
        <div className="space-y-4">
          {filteredOrganizers.map((organizer) => (
            <div
              key={organizer.id}
              onClick={() => onOrganizerClick(organizer.id)}
              className="p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-all cursor-pointer event-card"
            >
              <div className="flex items-start gap-3">
                <div className="avatar-story">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-surface text-lg font-bold">
                      {organizer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {organizer.name}
                    </h3>
                    {organizer.verified && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ Verificado
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {organizer.bio}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{organizer.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{organizer.events} eventos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(organizer.rating)}
                      <span className="ml-1">{organizer.rating}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {organizer.category}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrganizers.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum organizador encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 p-4 bg-surface rounded-lg">
          <h3 className="font-semibold text-foreground mb-3">Estatísticas</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{organizers.length}</p>
              <p className="text-xs text-muted-foreground">Total de organizadores</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {organizers.filter(o => o.verified).length}
              </p>
              <p className="text-xs text-muted-foreground">Verificados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}