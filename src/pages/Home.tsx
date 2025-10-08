import { useState } from "react";
import { Users, Search, Filter, Crown } from "lucide-react";
import { Header } from "@/components/Header";
import { EventFeed } from "@/components/EventFeed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
interface HomeProps {
  onEventClick: (eventId: string) => void;
  onFindFriends: () => void;
  onOrganizerClick: (organizerId: string) => void;
  onShowOrganizers?: () => void;
  userType: "user" | "organizer";
}
export default function Home({
  onEventClick,
  onFindFriends,
  onOrganizerClick,
  onShowOrganizers,
  userType
}: HomeProps) {
  const [hasLiveEvent] = useState(true); // Mock live event detection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const categories = [{
    id: "todos",
    label: "Todos"
  }, {
    id: "cristao",
    label: "🙏 Cristão"
  }, {
    id: "vendas",
    label: "💰 Vendas"
  }, {
    id: "streemer",
    label: "🎮 Streemer"
  }, {
    id: "festas",
    label: "🎉 Festas"
  }, {
    id: "eventos",
    label: "📅 Eventos"
  }, {
    id: "eletronica",
    label: "🎵 Eletrônica"
  }, {
    id: "rock",
    label: "🎸 Rock"
  }, {
    id: "pop",
    label: "🎤 Pop"
  }, {
    id: "forro",
    label: "🪗 Forró"
  }, {
    id: "sertanejo",
    label: "🤠 Sertanejo"
  }, {
    id: "funk",
    label: "🕺 Funk"
  }, {
    id: "samba",
    label: "🥁 Samba"
  }, {
    id: "jazz",
    label: "🎺 Jazz"
  }, {
    id: "outros",
    label: "🎭 Outros"
  }];
  return <div className="min-h-screen bg-background pb-20">
      <Header title="Eventos" userType={userType} showNotifications={true} showLocation={true} />
      
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
        <EventFeed onEventClick={onEventClick} onOrganizerClick={onOrganizerClick} userType={userType} categoryFilter={selectedCategory} searchQuery={searchQuery} />
      </main>
    </div>;
}