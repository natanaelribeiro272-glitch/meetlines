import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOrganizer } from "@/hooks/useOrganizer";
import { useAuth } from "@/hooks/useAuth";
import { OrganizerWithStories } from "@/hooks/useOrganizerStories";

interface OrganizerStoriesBarProps {
  organizersWithStories: OrganizerWithStories[];
  onOrganizerClick: (organizer: OrganizerWithStories) => void;
  onCreateStory?: () => void;
}

export function OrganizerStoriesBar({ 
  organizersWithStories, 
  onOrganizerClick,
  onCreateStory 
}: OrganizerStoriesBarProps) {
  const { organizerData } = useOrganizer();
  const { user } = useAuth();

  // Verificar se o usuário é um organizador
  const isOrganizer = !!organizerData;

  return (
    <div className="border-b border-border bg-background">
      <div className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-hide">
        {/* Botão de criar story (apenas para organizadores) */}
        {isOrganizer && onCreateStory && (
          <button
            onClick={onCreateStory}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-background">
                <AvatarImage src={organizerData.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {organizerData.page_title.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-primary rounded-full flex items-center justify-center ring-2 ring-background group-hover:scale-110 transition-transform">
                <Plus className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground max-w-[64px] truncate">
              Seu Story
            </span>
          </button>
        )}

        {/* Stories dos organizadores */}
        {organizersWithStories.map((org) => (
          <button
            key={org.id}
            onClick={() => onOrganizerClick(org)}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="relative">
              <div
                className={`h-16 w-16 rounded-full p-[2px] ${
                  org.has_unviewed
                    ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500'
                    : 'bg-muted'
                }`}
              >
                <Avatar className="h-full w-full ring-2 ring-background">
                  <AvatarImage src={org.avatar_url || undefined} />
                  <AvatarFallback className="bg-surface">
                    {org.page_title.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs text-foreground max-w-[64px] truncate group-hover:text-primary transition-colors">
              {org.page_title}
            </span>
          </button>
        ))}

        {/* Mensagem quando não há stories */}
        {organizersWithStories.length === 0 && !isOrganizer && (
          <div className="flex items-center justify-center w-full py-4">
            <p className="text-sm text-muted-foreground">
              Nenhum story disponível no momento
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
