import { useState } from "react";
import { ArrowLeft, Users, Calendar, MapPin, Settings, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

// Mock organizer events data
const mockOrganizerEvents = [
  {
    id: "org-1",
    title: "Festival Eletrônico 2024",
    image: event1,
    date: "2024-03-15",
    time: "22:00",
    location: "Club Neon, Vila Madalena",
    maxAttendees: 300,
    registrations: 45,
    status: "upcoming",
    requiresRegistration: true,
    formFields: 6
  },
  {
    id: "org-2", 
    title: "Rooftop Party Sunset",
    image: event2,
    date: "2024-03-20",
    time: "18:00",
    location: "Terraço Sky Bar, Pinheiros",
    maxAttendees: 80,
    registrations: 67,
    status: "upcoming",
    requiresRegistration: false,
    formFields: 0
  },
  {
    id: "org-3",
    title: "Arte & Música Underground",
    image: event3,
    date: "2024-02-28",
    time: "20:00", 
    location: "Galeria Subterrâneo, Centro",
    maxAttendees: 120,
    registrations: 89,
    status: "completed",
    requiresRegistration: true,
    formFields: 4
  }
];

interface OrganizerEventsProps {
  onBack: () => void;
  onCreateEvent: () => void;
  onManageRegistrations: (eventId: string) => void;
}

export default function OrganizerEvents({ 
  onBack, 
  onCreateEvent, 
  onManageRegistrations 
}: OrganizerEventsProps) {
  const [selectedTab, setSelectedTab] = useState("upcoming");

  const filteredEvents = mockOrganizerEvents.filter(event => 
    selectedTab === "all" || event.status === selectedTab
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="default">Próximo</Badge>;
      case "live":
        return <Badge className="bg-red-500 text-white">Ao Vivo</Badge>;
      case "completed":
        return <Badge variant="secondary">Concluído</Badge>;
      default:
        return null;
    }
  };

  const getOccupancyColor = (registrations: number, maxAttendees: number) => {
    const percentage = (registrations / maxAttendees) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-orange-600"; 
    return "text-green-600";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Meus Eventos</h1>
          <Button variant="ghost" size="icon" onClick={onCreateEvent}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto pb-20">
        {/* Summary Stats */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {mockOrganizerEvents.filter(e => e.status === "upcoming").length}
                </div>
                <div className="text-xs text-muted-foreground">Próximos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {mockOrganizerEvents.reduce((acc, e) => acc + e.registrations, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Cadastros</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {mockOrganizerEvents.filter(e => e.status === "completed").length}
                </div>
                <div className="text-xs text-muted-foreground">Realizados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="completed">Realizados</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4 space-y-4">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum evento encontrado</p>
                  <Button onClick={onCreateEvent} className="mt-2" size="sm">
                    Criar Primeiro Evento
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <div className="flex">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-20 h-20 object-cover"
                    />
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
                        {getStatusBadge(event.status)}
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                        {event.requiresRegistration && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className={getOccupancyColor(event.registrations, event.maxAttendees)}>
                              {event.registrations}/{event.maxAttendees} cadastros
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {event.requiresRegistration && (
                    <div className="px-3 pb-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8"
                          onClick={() => onManageRegistrations(event.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Cadastros
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => {
                            // Simulate form editing
                            console.log("Editando formulário do evento:", event.id);
                          }}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {!event.requiresRegistration && event.status === "upcoming" && (
                    <div className="px-3 pb-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8"
                        onClick={() => {
                          // Simulate adding registration form
                          console.log("Adicionando formulário ao evento:", event.id);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar Cadastro
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}