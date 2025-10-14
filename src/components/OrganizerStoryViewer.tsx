import { useState, useEffect } from "react";
import { X, Heart, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrganizerWithStories, OrganizerStory } from "@/hooks/useOrganizerStories";
import { useOrganizer } from "@/hooks/useOrganizer";
import { cn } from "@/lib/utils";

interface OrganizerStoryViewerProps {
  open: boolean;
  onClose: () => void;
  organizer: OrganizerWithStories;
  initialStoryIndex?: number;
  onLike: (storyId: string) => void;
  onDelete?: (storyId: string) => void;
  onMarkAsViewed: (storyId: string) => void;
}

export function OrganizerStoryViewer({
  open,
  onClose,
  organizer,
  initialStoryIndex = 0,
  onLike,
  onDelete,
  onMarkAsViewed,
}: OrganizerStoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const { organizerData } = useOrganizer();

  const currentStory = organizer.stories[currentIndex];
  const isOwner = !!organizerData && organizerData.id === organizer.id;
  const duration = currentStory?.media_type === 'video' ? 10000 : 5000; // 10s para vídeo, 5s para imagem

  useEffect(() => {
    setCurrentIndex(initialStoryIndex);
    setProgress(0);
  }, [initialStoryIndex, open]);

  useEffect(() => {
    if (!open || !currentStory) return;

    // Marcar como visualizado
    onMarkAsViewed(currentStory.id);

    // Progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Avançar para próximo story
          if (currentIndex < organizer.stories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [open, currentIndex, currentStory, duration]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < organizer.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleLike = () => {
    onLike(currentStory.id);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (window.confirm('Deseja excluir este story?')) {
      onDelete(currentStory.id);
      if (currentIndex < organizer.stories.length - 1) {
        handleNext();
      } else if (currentIndex > 0) {
        handlePrevious();
      } else {
        onClose();
      }
    }
  };

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[90vh] p-0 bg-black border-none">
        <div className="relative h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {organizer.stories.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className={cn(
                    "h-full bg-white transition-all duration-100",
                    index < currentIndex && "w-full",
                    index === currentIndex && `w-[${progress}%]`,
                    index > currentIndex && "w-0"
                  )}
                  style={
                    index === currentIndex ? { width: `${progress}%` } : undefined
                  }
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-white">
                <AvatarImage src={organizer.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {organizer.page_title.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium text-sm">
                {organizer.page_title}
              </span>
              <span className="text-white/70 text-xs">
                {new Date(currentStory.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* Navigation areas */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
              onClick={handlePrevious}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
              onClick={handleNext}
            />

            {currentStory.media_type === 'video' ? (
              <video
                src={currentStory.media_url}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                loop={false}
                controls={false}
              />
            ) : (
              <img
                src={currentStory.media_url}
                alt="Story"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-white">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">{currentStory.views_count || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-white">
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      currentStory.is_liked && "fill-red-500 text-red-500"
                    )}
                  />
                  <span className="text-sm">{currentStory.likes_count || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Like button (se não for o dono) */}
                {!isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLike}
                    className="text-white hover:bg-white/20"
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        currentStory.is_liked && "fill-red-500 text-red-500"
                      )}
                    />
                  </Button>
                )}

                {/* Delete button (apenas para o dono) */}
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="text-white hover:bg-red-500/20"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Navigation hints */}
            <div className="flex items-center justify-center gap-4 mt-2">
              {currentIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              )}
              {currentIndex < organizer.stories.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
