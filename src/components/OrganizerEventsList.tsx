import { Calendar, MapPin, Eye, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganizer } from "@/hooks/useOrganizer";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";

interface OrganizerEventsListProps {
  onCreateEvent: () => void;
}

export default function OrganizerEventsList({ onCreateEvent }: OrganizerEventsListProps) {
  const { events, loading } = useOrganizer();
  const upcomingEvents = events.filter(event => event.status === 'upcoming');
  const completedEvents = events.filter(event => event.status === 'completed');
  const totalRegistrations = events.reduce((sum, event) => sum + event.current_attendees, 0);

  const eventsSummary = {
    upcoming: upcomingEvents.length,
    registrations: totalRegistrations,
    completed: completedEvents.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Meus Eventos</h2>
        <Button size="sm" onClick={onCreateEvent}>
          + Criar Evento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{eventsSummary.upcoming}</div>
            <p className="text-sm text-muted-foreground">Próximos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-500">{eventsSummary.registrations}</div>
            <p className="text-sm text-muted-foreground">Cadastros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{eventsSummary.completed}</div>
            <p className="text-sm text-muted-foreground">Realizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Events Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="completed">Realizados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingEvents.length > 0 ? (
            <>
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {event.image_url && (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground line-clamp-1">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(event.event_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {event.status === 'upcoming' ? 'Próximo' : event.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-emerald-600 mt-2">
                          <Users className="h-3 w-3" />
                          <span>{event.current_attendees}/{event.max_attendees || '∞'} participantes</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        disabled={!event.requires_registration}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Cadastros
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Nenhum evento próximo</p>
              <Button onClick={onCreateEvent}>
                Criar Primeiro Evento
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedEvents.length > 0 ? (
            completedEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {event.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground line-clamp-1">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(event.event_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                          Realizado
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum evento realizado ainda</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {events.length > 0 ? (
            events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {event.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground line-clamp-1">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(event.event_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className={
                          event.status === 'completed' 
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-primary/10 text-primary"
                        }>
                          {event.status === 'upcoming' ? 'Próximo' : 
                           event.status === 'completed' ? 'Realizado' : event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Nenhum evento criado ainda</p>
              <Button onClick={onCreateEvent}>
                Criar Primeiro Evento
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}