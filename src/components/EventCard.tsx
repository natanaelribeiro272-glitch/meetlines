import { Heart, MessageCircle, Users, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
interface EventCardProps {
  id: string;
  title: string;
  image: string;
  organizerName: string;
  organizerAvatar?: string;
  date: string;
  location: string;
  locationLink?: string;
  estimatedAttendees: number;
  likes: number;
  comments: number;
  isLiked: boolean;
  isLive: boolean;
  price?: number;
  onClick?: () => void;
  onLike?: () => void;
  onOrganizerClick?: () => void;
  requiresRegistration?: boolean;
  userType?: "user" | "organizer";
  isOwnEvent?: boolean;
  onRegister?: () => void;
  onManageRegistrations?: () => void;
}
export function EventCard({
  title,
  image,
  organizerName,
  organizerAvatar,
  date,
  location,
  locationLink,
  estimatedAttendees,
  likes,
  comments,
  isLiked,
  isLive,
  price,
  onClick,
  onLike,
  onOrganizerClick,
  requiresRegistration = false,
  userType = "user",
  isOwnEvent = false,
  onRegister,
  onManageRegistrations
}: EventCardProps) {
  return <div className="event-card bg-card rounded-lg overflow-hidden shadow-card cursor-pointer" onClick={onClick}>
      {/* Header - Organizer info */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="avatar-story cursor-pointer" onClick={e => {
        e.stopPropagation();
        onOrganizerClick?.();
      }}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={organizerAvatar} alt={organizerName} />
            <AvatarFallback className="bg-surface text-xs">
              {organizerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 cursor-pointer" onClick={e => {
        e.stopPropagation();
        onOrganizerClick?.();
      }}>
          <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">{organizerName}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{date}</span>
            {isLive && <span className="flex items-center gap-1 text-destructive font-medium">
                <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                ACONTECENDO AGORA
              </span>}
          </div>
        </div>
      </div>

      {/* Event Image */}
      <div className="relative">
        <img src={image} alt={title} className="w-full h-64 object-cover" />
        {price && price > 0 ? <div className="absolute top-3 right-3 bg-destructive/90 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="text-xs font-medium text-white">PAGO</span>
          </div> : <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="text-xs font-medium text-primary-foreground">GRÁTIS</span>
          </div>}
      </div>

      {/* Event Info */}
      <div className="p-4 pt-3">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{title}</h3>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={e => {
            e.stopPropagation();
            onLike?.();
          }} className="flex items-center gap-1 transition-smooth hover:scale-110">
              <Heart className={`h-5 w-5 ${isLiked ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
              <span className="text-sm text-muted-foreground">{likes}</span>
            </button>
            
            <div className="flex items-center gap-1">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{comments}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{estimatedAttendees}</span>
            </div>
          </div>

          {isLive && locationLink}
        </div>
        
        {/* Registration Badge */}
        {requiresRegistration && <div className="mt-2">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              <Users className="h-3 w-3" />
              Requer cadastro
            </div>
          </div>}
      </div>
    </div>;
}