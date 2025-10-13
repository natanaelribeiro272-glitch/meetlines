import { useState, useEffect } from "react";
import { Users, Search, Filter, Crown } from "lucide-react";
import { Header } from "@/components/Header";
import { EventFeed } from "@/components/EventFeed";
import { OrganizerStoriesBar } from "@/components/OrganizerStoriesBar";
import { OrganizerStoryViewer } from "@/components/OrganizerStoryViewer";
import { OrganizerStoryUploadDialog } from "@/components/OrganizerStoryUploadDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { useOrganizerStories, OrganizerWithStories } from "@/hooks/useOrganizerStories";
import { useOrganizer } from "@/hooks/useOrganizer";

interface HomeProps {
  onEventClick: (eventId: string) => void;
  onFindFriends: () => void;
  onOrganizerClick: (organizerId: string) => void;
  onShowOrganizers?: () => void;
  onStoryClick: (userId: string) => void;
  userType: "user" | "organizer";
}
export default function Home({
  onEventClick,
  onFindFriends,
  onOrganizerClick,
  onShowOrganizers,
  onStoryClick,
  userType
}: HomeProps) {
  const { profile } = useProfile();
  const [hasLiveEvent] = useState(true); // Mock live event detection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [userInterests, setUserInterests] = useState<string[]>([]);
  
  const { 
    organizersWithStories, 
    loading: storiesLoading,
    createStory,
    deleteStory,
    markAsViewed,
    toggleLike,
  } = useOrganizerStories();
  
  const { organizerData } = useOrganizer();
  const [selectedOrganizer, setSelectedOrganizer] = useState<OrganizerWithStories | null>(null);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleOrganizerStoryClick = (org: OrganizerWithStories) => {
    setSelectedOrganizer(org);
    setStoryViewerOpen(true);
  };

  const handleCreateStory = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadStory = async (file: File) => {
    if (!organizerData) return;
    await createStory(organizerData.id, file);
  };
  
  // Extrair interesses do perfil do usuário
  useEffect(() => {
    if (profile?.notes && profile.notes.includes('Interesses:')) {
      const interestsMatch = profile.notes.match(/Interesses:\s*(.+)/);
      if (interestsMatch) {
        const interests = interestsMatch[1].split(',').map(i => i.trim());
        setUserInterests(interests);
      }
    }
  }, [profile]);
  
  const categories = [{
    id: "todos",
    label: "Todos"
  }, {
    id: "festas",
    label: "🎉 Festas"
  }, {
    id: "shows",
    label: "🎤 Shows"
  }, {
    id: "encontros",
    label: "👥 Encontros"
  }, {
    id: "cristao",
    label: "🙏 Cristão"
  }, {
    id: "esportes",
    label: "⚽ Esportes"
  }, {
    id: "educacao",
    label: "📚 Educação"
  }, {
    id: "networking",
    label: "💼 Networking"
  }, {
    id: "gastronomia",
    label: "🍽️ Gastronomia"
  }, {
    id: "arte",
    label: "🎨 Arte & Cultura"
  }, {
    id: "musica",
    label: "🎵 Música"
  }, {
    id: "outros",
    label: "🎭 Outros"
  }];
  return <div className="min-h-screen bg-background pb-20">
      <Header title="Eventos" userType={userType} showNotifications={true} showLocation={true} />
      
      {/* Organizer Stories Bar */}
      <OrganizerStoriesBar 
        organizersWithStories={organizersWithStories}
        onOrganizerClick={handleOrganizerStoryClick}
        onCreateStory={organizerData ? handleCreateStory : undefined}
      />
      
      <main className="px-4 py-4 max-w-md mx-auto">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="text" placeholder="Buscar eventos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-12" />
            <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8">
              <Filter className="h-4 w-4" />
            </Button>
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
        {/* Organizers Button */}
        {onShowOrganizers && <div className="mb-4">
            <Button onClick={onShowOrganizers} variant="outline" className="w-full justify-start gap-2 h-12">
              <Crown className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium">Ver Organizadores</p>
                <p className="text-xs text-muted-foreground">Descubra os melhores da cidade</p>
              </div>
            </Button>
          </div>}

        {/* Live Event CTA */}
        {hasLiveEvent && <div className="mb-6 p-4 bg-surface rounded-lg border border-primary/20 glow-purple cursor-pointer transition-all hover:bg-surface/80" onClick={() => onEventClick("live-events")}>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-destructive rounded-full animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Evento acontecendo agora!
                </p>
                <p className="text-xs text-muted-foreground">Clique aqui e saiba todos eventos que estão rolando na cidade</p>
              </div>
            </div>
          </div>}

        {/* Event Feed */}
        {userInterests.length > 0 && selectedCategory === "todos" && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary font-medium">
              ✨ Eventos recomendados baseados nos seus interesses: {userInterests.join(', ')}
            </p>
          </div>
        )}
        <EventFeed 
          onEventClick={onEventClick} 
          onOrganizerClick={onOrganizerClick} 
          userType={userType} 
          categoryFilter={selectedCategory} 
          searchQuery={searchQuery}
          userInterests={selectedCategory === "todos" ? userInterests : undefined}
        />
      </main>

      {/* Story Viewer */}
      {selectedOrganizer && (
        <OrganizerStoryViewer
          open={storyViewerOpen}
          onClose={() => setStoryViewerOpen(false)}
          organizer={selectedOrganizer}
          onLike={toggleLike}
          onDelete={organizerData?.id === selectedOrganizer.id ? deleteStory : undefined}
          onMarkAsViewed={markAsViewed}
        />
      )}

      {/* Upload Dialog */}
      {organizerData && (
        <OrganizerStoryUploadDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onUpload={handleUploadStory}
        />
      )}
    </div>;
}