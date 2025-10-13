import { useState, useEffect } from "react";
import { X, Heart, MessageCircle, Send, MoreVertical, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  user_name: string;
  user_avatar: string;
}

interface StoryComment {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_name: string;
  user_avatar: string;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryDeleted?: (wasLast: boolean) => void;
}

export default function StoryViewer({ stories, initialIndex, open, onOpenChange, onStoryDeleted }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likesList, setLikesList] = useState<Array<{ user_name: string; user_avatar: string }>>([]);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLikesList, setShowLikesList] = useState(false);
  const { user } = useAuth();

  const currentStory = stories[currentIndex];
  const isOwnStory = currentStory?.user_id === user?.id;

  // Load likes and check if user liked
  useEffect(() => {
    if (!currentStory || !user) return;

    const loadLikes = async () => {
      const { data: likesData } = await supabase
        .from('story_likes')
        .select('user_id')
        .eq('story_id', currentStory.id);

      setLikesCount(likesData?.length || 0);

      // If it's own story, load list of users who liked
      if (isOwnStory && likesData && likesData.length > 0) {
        const userIds = likesData.map(like => like.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        if (profilesData) {
          setLikesList(profilesData.map(p => ({
            user_name: p.display_name || 'Usuário',
            user_avatar: p.avatar_url || ''
          })));
        }
      } else {
        // Check if current user liked
        const { data: userLike } = await supabase
          .from('story_likes')
          .select('*')
          .eq('story_id', currentStory.id)
          .eq('user_id', user.id)
          .single();

        setLiked(!!userLike);
      }
    };

    loadLikes();

    // Mark story as viewed
    const markAsViewed = async () => {
      await supabase
        .from('story_views')
        .insert({
          story_id: currentStory.id,
          viewer_id: user.id
        })
        .select()
        .single();
    };

    markAsViewed();
  }, [currentStory, user, isOwnStory]);

  // Load comments
  useEffect(() => {
    if (!currentStory) return;

    const loadComments = async () => {
      const { data: commentsData } = await supabase
        .from('story_comments')
        .select(`
          id,
          user_id,
          comment,
          created_at
        `)
        .eq('story_id', currentStory.id)
        .order('created_at', { ascending: true });

      if (commentsData) {
        // Load user profiles for comments
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

        const enrichedComments = commentsData.map(comment => ({
          ...comment,
          user_name: profilesMap.get(comment.user_id)?.display_name || 'Usuário',
          user_avatar: profilesMap.get(comment.user_id)?.avatar_url || ''
        }));

        setComments(enrichedComments);
      }
    };

    loadComments();
  }, [currentStory]);

  const handleLike = async () => {
    if (!user || !currentStory) return;

    if (liked) {
      // Unlike
      await supabase
        .from('story_likes')
        .delete()
        .eq('story_id', currentStory.id)
        .eq('user_id', user.id);

      setLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      // Like
      await supabase
        .from('story_likes')
        .insert({
          story_id: currentStory.id,
          user_id: user.id
        });

      setLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const handleComment = async () => {
    if (!user || !currentStory || !newComment.trim()) return;

    const { error } = await supabase
      .from('story_comments')
      .insert({
        story_id: currentStory.id,
        user_id: user.id,
        comment: newComment
      });

    if (error) {
      toast.error('Erro ao comentar');
      return;
    }

    // Send notification to story owner via message
    if (currentStory.user_id !== user.id) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      await supabase
        .from('user_messages')
        .insert({
          from_user_id: user.id,
          to_user_id: currentStory.user_id,
          content: `Respondeu sua história: "${newComment}"`
        });
    }

    setNewComment("");
    toast.success('Comentário enviado!');

    // Reload comments
    const { data: commentsData } = await supabase
      .from('story_comments')
      .select(`
        id,
        user_id,
        comment,
        created_at
      `)
      .eq('story_id', currentStory.id)
      .order('created_at', { ascending: true });

    if (commentsData) {
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const enrichedComments = commentsData.map(comment => ({
        ...comment,
        user_name: profilesMap.get(comment.user_id)?.display_name || 'Usuário',
        user_avatar: profilesMap.get(comment.user_id)?.avatar_url || ''
      }));

      setComments(enrichedComments);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowComments(false);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowComments(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!user || !currentStory) return;

    try {
      // Delete story from database
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', currentStory.id);

      if (deleteError) throw deleteError;

      // Delete image from storage
      const filePath = currentStory.image_url.split('/').slice(-3).join('/');
      await supabase.storage
        .from('user-uploads')
        .remove([filePath]);

      toast.success('Story excluído!');
      
      // Notify parent to reload stories (and if this was the last one)
      onStoryDeleted?.(stories.length <= 1);
      
      // Close dialog and viewer
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Erro ao excluir story');
    }
  };

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 bg-black border-0 h-[90vh]">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage src={currentStory.user_avatar} />
                  <AvatarFallback>{currentStory.user_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold text-sm">{currentStory.user_name}</p>
                  <p className="text-white/70 text-xs">
                    {new Date(currentStory.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Show delete option only for own stories */}
                {currentStory.user_id === user?.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-surface border-border">
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-500 focus:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir story
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Story Image */}
          <div 
            className="flex-1 bg-center bg-cover bg-no-repeat cursor-pointer"
            style={{ backgroundImage: `url(${currentStory.image_url})` }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              if (x < rect.width / 2) {
                handlePrevious();
              } else {
                handleNext();
              }
            }}
          />

          {/* Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            {isOwnStory ? (
              // Own story - show who liked
              <div className="mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLikesList(!showLikesList)}
                  className="text-white hover:bg-white/20 gap-2"
                >
                  <Heart className="h-5 w-5" />
                  <span>{likesCount} {likesCount === 1 ? 'curtida' : 'curtidas'}</span>
                </Button>

                {showLikesList && likesCount > 0 && (
                  <div className="mt-2 bg-black/50 rounded-lg p-3 max-h-40">
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {likesList.map((like, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={like.user_avatar} />
                              <AvatarFallback>{like.user_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-white text-sm">{like.user_name}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ) : (
              // Other's story - show like and comment buttons
              <>
                <div className="flex items-center gap-4 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className="text-white hover:bg-white/20 gap-2"
                  >
                    <Heart className={`h-5 w-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{likesCount}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(!showComments)}
                    className="text-white hover:bg-white/20 gap-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{comments.length}</span>
                  </Button>
                </div>

                {/* Comments Section */}
                {showComments && (
                  <div className="bg-black/50 rounded-lg p-3 mb-3 max-h-40">
                    <ScrollArea className="h-32">
                      {comments.length === 0 ? (
                        <p className="text-white/70 text-sm text-center">Nenhum comentário ainda</p>
                      ) : (
                        <div className="space-y-2">
                          {comments.map(comment => (
                            <div key={comment.id} className="flex gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={comment.user_avatar} />
                                <AvatarFallback>{comment.user_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-white text-sm">
                                  <span className="font-semibold">{comment.user_name}</span>{' '}
                                  {comment.comment}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}

                {/* Comment Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enviar mensagem..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Button
                    onClick={handleComment}
                    disabled={!newComment.trim()}
                    className="bg-primary hover:bg-primary-glow"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-surface border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir story?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Seu story será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStory}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
