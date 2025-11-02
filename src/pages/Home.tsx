import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Crown, CalendarDays } from "lucide-react";
import { Header } from "@/components/Header";
import { EventFeed } from "@/components/EventFeed";
import { OrganizerStoriesBar } from "@/components/OrganizerStoriesBar";
import { OrganizerStoryViewer } from "@/components/OrganizerStoryViewer";
import { OrganizerStoryUploadDialog } from "@/components/OrganizerStoryUploadDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useProfile";
import { useOrganizerStories, OrganizerWithStories } from "@/hooks/useOrganizerStories";
import { useOrganizer } from "@/hooks/useOrganizer";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

export default function Home() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const {
    profile
  } = useProfile();
  const [hasLiveEvent] = useState(true);
  const [hasWeekEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const {
    organizersWithStories,
    loading: storiesLoading,
    uploadingStory,
    createStory,
    deleteStory,
    markAsViewed,
    toggleLike
  } = useOrganizerStories();
  const {
    organizerData
  } = useOrganizer();
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

  const handleUploadStory = (file: File) => {
    if (!organizerData) return;
    // Inicia o upload em background
    createStory(organizerData.id, file);
  };

  // Extrair interesses do perfil do usuário a partir de profiles.interests (fallback para notes)
  useEffect(() => {
    if (Array.isArray((profile as any)?.interests) && (profile as any).interests.length > 0) {
      setUserInterests((profile as any).interests as string[]);
      return;
    }
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
    label: "Festas"
  }, {
    id: "shows",
    label: "Shows"
  }, {
    id: "fitness",
    label: "Fitness"
  }, {
    id: "igreja",
    label: "Igreja"
  }, {
    id: "cursos",
    label: "Cursos"
  }, {
    id: "bares",
    label: "Bares"
  }, {
    id: "boates",
    label: "Boates"
  }, {
    id: "esportes",
    label: "Esportes"
  }, {
    id: "encontros",
    label: "Encontros"
  }];
  return <ProtectedRoute requireAuth={true}>
    <AppLayout>
      <div className="pb-20">
        <Header title="Eventos" userType={userRole || "user"} showNotifications={true} showLocation={true} />
      
      {/* Organizer Stories Bar */}
      <OrganizerStoriesBar organizersWithStories={organizersWithStories} onOrganizerClick={handleOrganizerStoryClick} onCreateStory={organizerData ? handleCreateStory : undefined} uploadingStory={uploadingStory} />
      
      <main className="px-4 py-4 max-w-md mx-auto">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="text" placeholder="Buscar eventos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
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
        <div className="mb-4">
          <Button onClick={() => navigate("/organizadores")} variant="outline" className="w-full justify-start gap-2 h-12">
            <Crown className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="text-sm font-medium">Ver Organizadores</p>
              <p className="text-xs text-muted-foreground">Descubra os melhores da cidade</p>
            </div>
          </Button>
        </div>

        {/* Quick Event Navigation */}
        <div className="mb-6 flex gap-3">
          {hasLiveEvent && (
            <button
              onClick={() => navigate("/eventos-ao-vivo")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface rounded-lg border border-primary/20 shadow-sm cursor-pointer transition-all hover:bg-surface/80 hover:border-primary/40"
            >
              <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium text-foreground">Agora</span>
            </button>
          )}

          {hasWeekEvents && (
            <button
              onClick={() => navigate("/eventos-da-semana")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface rounded-lg border border-primary/20 shadow-sm cursor-pointer transition-all hover:bg-surface/80 hover:border-primary/40"
            >
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Nessa Semana</span>
            </button>
          )}
        </div>

        {/* Event Feed */}
        {userInterests.length > 0 && selectedCategory === "todos"}
        <EventFeed
          onEventClick={(eventId) => navigate(`/evento/${eventId}`)}
          onOrganizerClick={(organizerId) => navigate(`/organizador/${organizerId}/perfil`)}
          userType={userRole || "user"}
          categoryFilter={selectedCategory}
          searchQuery={searchQuery}
          userInterests={selectedCategory === "todos" ? userInterests : undefined}
        />
      </main>

      {/* Story Viewer */}
      {selectedOrganizer && <OrganizerStoryViewer open={storyViewerOpen} onClose={() => setStoryViewerOpen(false)} organizer={selectedOrganizer} onLike={toggleLike} onDelete={organizerData?.id === selectedOrganizer.id ? deleteStory : undefined} onMarkAsViewed={markAsViewed} />}

      {/* Upload Dialog */}
      {organizerData && <OrganizerStoryUploadDialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} onUpload={handleUploadStory} />}
    </div>
    </AppLayout>
  </ProtectedRoute>;
}