import { useState } from "react";
import { Calendar, MapPin, Eye, Users, Settings, Edit, Trash2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useOrganizer } from "@/hooks/useOrganizer";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";

interface OrganizerEventsListProps {
  onCreateEvent: () => void;
  onManageRegistrations?: (eventId: string) => void;
  onViewAttendances?: (eventId: string) => void;
}

export default function OrganizerEventsList({ onCreateEvent, onManageRegistrations, onViewAttendances }: OrganizerEventsListProps) {
  const { events, loading, updateEvent, deleteEvent } = useOrganizer();
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    max_attendees: 0
  });
  
  const upcomingEvents = events.filter(event => event.status === 'upcoming');
  const completedEvents = events.filter(event => event.status === 'completed');
  const totalRegistrations = events.reduce((sum, event) => sum + event.current_attendees, 0);

  const eventsSummary = {
    upcoming: upcomingEvents.length,
    registrations: totalRegistrations,
    completed: completedEvents.length,
  };

  const handleEditEvent = (event: any) => {
    setOpenDropdownId(null); // Fecha o dropdown primeiro
    setTimeout(() => {
      setEditingEvent(event);
      setEditForm({
        title: event.title,
        description: event.description || "",
        location: event.location,
        event_date: new Date(event.event_date).toISOString().slice(0, 16),
        max_attendees: event.max_attendees || 0
      });
    }, 100);
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;
    
    await updateEvent(editingEvent.id, {
      ...editForm,
      event_date: new Date(editForm.event_date).toISOString()
    });
    
    setEditingEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (!deletingEventId) return;
    await deleteEvent(deletingEventId);
    setDeletingEventId(null);
  };

  const handleDeleteClick = (eventId: string) => {
    setOpenDropdownId(null); // Fecha o dropdown primeiro
    setTimeout(() => {
      setDeletingEventId(eventId);
    }, 100);
  };

  const handleEndEvent = async (eventId: string) => {
    await updateEvent(eventId, {
      is_live: false,
      status: 'completed'
    });
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
                          <div className="flex flex-col gap-1 items-end">
                            {event.is_live && (
                              <Badge variant="destructive" className="mb-1">
                                <div className="h-2 w-2 bg-white rounded-full animate-pulse mr-1" />
                                AO VIVO
                              </Badge>
                            )}
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              {event.status === 'upcoming' ? 'Próximo' : event.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-emerald-600 mt-2">
                          <Users className="h-3 w-3" />
                          <span>{event.current_attendees}/{event.max_attendees || '∞'} participantes</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      {event.is_live && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleEndEvent(event.id)}
                        >
                          <StopCircle className="h-4 w-4 mr-1" />
                          Encerrar Evento
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={event.is_live ? "" : "flex-1"}
                        disabled={!event.requires_registration}
                        onClick={() => onManageRegistrations?.(event.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Cadastros
                      </Button>
                      <DropdownMenu open={openDropdownId === event.id} onOpenChange={(open) => setOpenDropdownId(open ? event.id : null)}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(event.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                          Realizado
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    {event.requires_registration && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onManageRegistrations?.(event.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Cadastros
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewAttendances?.(event.id)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Ver Confirmações
                    </Button>
                    <DropdownMenu open={openDropdownId === event.id} onOpenChange={(open) => setOpenDropdownId(open ? event.id : null)}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(event.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {event.is_live && (
                            <Badge variant="destructive" className="mb-1">
                              <div className="h-2 w-2 bg-white rounded-full animate-pulse mr-1" />
                              AO VIVO
                            </Badge>
                          )}
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
                  </div>
                  
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    {event.is_live && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleEndEvent(event.id)}
                      >
                        <StopCircle className="h-4 w-4 mr-1" />
                        Encerrar Evento
                      </Button>
                    )}
                    <DropdownMenu open={openDropdownId === event.id} onOpenChange={(open) => setOpenDropdownId(open ? event.id : null)}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-2" />
                          Gerenciar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(event.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Dialog de Edição */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Local</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-date">Data e Hora</Label>
              <Input
                id="edit-date"
                type="datetime-local"
                value={editForm.event_date}
                onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-max">Máximo de Participantes</Label>
              <Input
                id="edit-max"
                type="number"
                value={editForm.max_attendees}
                onChange={(e) => setEditForm({ ...editForm, max_attendees: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingEvent(null)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingEventId} onOpenChange={(open) => !open && setDeletingEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}