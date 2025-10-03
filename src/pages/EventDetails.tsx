import { ArrowLeft, MapPin, Users, Heart, MessageCircle, Share2, Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useEventDetails } from "@/hooks/useEventDetails";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface EventDetailsProps {
  onBack: () => void;
  eventId: string | null;
  onRegister?: () => void;
  onFindFriends?: () => void;
  onEdit?: (eventId: string) => void;
}

export default function EventDetails({ onBack, eventId, onRegister, onFindFriends, onEdit }: EventDetailsProps) {
  const { event, loading, comments, toggleLike, addComment } = useEventDetails(eventId);
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  
  const isOrganizer = user && event?.organizer?.user_id === user.id;

  // Função auxiliar para formatizar data
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayName = days[date.getDay()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${dayName}, ${hours}:${minutes}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return "agora";
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    await addComment(newComment);
    setNewComment("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative">
          <Skeleton className="w-full h-80" />
        </div>
        <div className="px-4 py-6 max-w-md mx-auto space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Evento não encontrado</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative">
        <img
          src={event.image_url || '/placeholder.svg'}
          alt={event.title}
          className="w-full h-80 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-surface/80 backdrop-blur-sm hover:bg-surface"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isOrganizer && onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="bg-surface/80 backdrop-blur-sm hover:bg-surface"
              onClick={() => onEdit(eventId!)}
            >
              <Edit className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="bg-surface/80 backdrop-blur-sm hover:bg-surface"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Live indicator */}
        {event.is_live && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-destructive/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium text-white">AO VIVO</span>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Event Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">{event.title}</h1>
          
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              {event.organizer?.profile?.avatar_url ? (
                <AvatarImage src={event.organizer.profile.avatar_url} />
              ) : (
                <AvatarFallback className="bg-surface">
                  {(event.organizer?.profile?.display_name || event.organizer?.page_title || 'O').charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {event.organizer?.profile?.display_name || event.organizer?.page_title || 'Organizador'}
              </p>
              <p className="text-sm text-muted-foreground">Organizador</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-foreground">{formatEventDate(event.event_date)}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-foreground">{event.location}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-foreground">{event.current_attendees} pessoas interessadas</span>
            </div>
          </div>
        </div>

        {/* Interests */}
        {event.interests && event.interests.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-3">Meus Interesses</h3>
            <div className="flex flex-wrap gap-2">
              {event.interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="default"
                  className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-2">Sobre o evento</h3>
          <p className="text-muted-foreground leading-relaxed">{event.description || 'Sem descrição disponível'}</p>
        </div>

        {/* Public Notes from Organizer */}
        {event.organizer?.profile?.notes && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-2">Notas do Organizador</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{event.organizer.profile.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-3">
            <Button variant="glow" className="flex-1" size="lg">
              Confirmar Presença
            </Button>
            {event.is_live ? (
              event.location_link && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.open(event.location_link, '_blank')}
                >
                  Link da Live
                </Button>
              )
            ) : (
              event.location_link && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.open(event.location_link, '_blank')}
                >
                  <MapPin className="h-4 w-4" />
                  Mapa
                </Button>
              )
            )}
          </div>
          
          {/* Registration button - sempre disponível */}
          <Button 
            variant="secondary" 
            className="w-full" 
            size="lg"
            onClick={onRegister}
          >
            <Users className="h-4 w-4 mr-2" />
            Fazer Cadastro no Evento
          </Button>
          
          {/* Find Friends button for live events */}
          {event.is_live && (
            <Button 
              variant="live" 
              className="w-full" 
              size="lg"
              onClick={onFindFriends}
            >
              <Users className="h-4 w-4 mr-2" />
              Encontrar Amigos no Evento
            </Button>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center justify-between py-4 border-t border-border">
          <div className="flex items-center gap-6">
            <button 
              className="flex items-center gap-2 transition-smooth hover:scale-110"
              onClick={toggleLike}
            >
              <Heart className={`h-5 w-5 ${event.is_liked ? 'text-destructive fill-current' : 'text-muted-foreground'}`} />
              <span className="text-sm text-muted-foreground">{event.likes_count || 0}</span>
            </button>
            
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{event.comments_count || 0} comentários</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Comentários</h3>
          
          {/* Add comment */}
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-surface text-xs">U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Adicione um comentário..."
                className="min-h-[80px] resize-none"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button 
                variant="glow" 
                size="sm" 
                className="mt-2"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Comentar
              </Button>
            </div>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  {comment.user?.avatar_url ? (
                    <AvatarImage src={comment.user.avatar_url} />
                  ) : (
                    <AvatarFallback className="bg-surface text-xs">
                      {(comment.user?.display_name || 'U').charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">
                      {comment.user?.display_name || 'Usuário'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Seja o primeiro a comentar!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}