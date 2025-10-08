import { useState } from "react";
import { ArrowLeft, Search, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizersList } from "@/hooks/useOrganizersList";

// Interface movida para o hook useOrganizersList

interface OrganizersListProps {
  onBack: () => void;
  onOrganizerClick: (organizerId: string) => void;
}
export default function OrganizersList({
  onBack,
  onOrganizerClick
}: OrganizersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const {
    organizers,
    loading
  } = useOrganizersList();
  const categories = [{
    id: "todos",
    label: "Todos"
  }, {
    id: "festas",
    label: "Festas"
  }, {
    id: "eventos",
    label: "Eventos"
  }, {
    id: "encontros",
    label: "Encontros"
  }, {
    id: "lives",
    label: "Lives"
  }, {
    id: "geek",
    label: "Geek"
  }, {
    id: "esporte",
    label: "Esporte"
  }, {
    id: "saúde",
    label: "Saúde"
  }, {
    id: "igreja",
    label: "Igreja"
  }, {
    id: "outro",
    label: "Outro"
  }];
  const filteredOrganizers = organizers.filter(organizer => {
    const matchesSearch = organizer.page_title.toLowerCase().includes(searchQuery.toLowerCase()) || (organizer.profile?.bio || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "todos" || (organizer.category || '') === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  if (loading) {
    return <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between p-4 max-w-md mx-auto">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Organizadores</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="p-4 max-w-md mx-auto pb-20 space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>)}
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
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
            <Input type="text" placeholder="Buscar organizadores..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all ${selectedCategory === category.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-muted-foreground hover:text-foreground hover:border-primary/50"}`}>
                <span className="text-sm font-medium">{category.label}</span>
              </button>)}
          </div>
        </div>

        {/* Organizers List */}
        <div className="space-y-4">
          {filteredOrganizers.map(organizer => <div key={organizer.id} onClick={() => onOrganizerClick(organizer.id)} className="p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-all cursor-pointer event-card">
              <div className="flex items-start gap-3">
                <div className="avatar-story">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={organizer.profile?.avatar_url || organizer.avatar_url} />
                    <AvatarFallback className="bg-surface text-lg font-bold">
                      {organizer.page_title.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {organizer.profile?.display_name || organizer.page_title}
                    </h3>
                    {organizer.verified && <Badge variant="secondary" className="text-xs">
                        ✓ Verificado
                      </Badge>}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {organizer.profile?.bio || organizer.page_description || 'Organizador de eventos'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{(organizer.stats?.followers_count || 0).toLocaleString()} seguidores</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{organizer.stats?.events_count || 0} eventos</span>
                    </div>
                  </div>
                  
                  {organizer.category && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {organizer.category.charAt(0).toUpperCase() + organizer.category.slice(1)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>)}
        </div>

        {filteredOrganizers.length === 0 && <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum organizador encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
          </div>}

        {/* Stats */}
        
      </div>
    </div>;
}