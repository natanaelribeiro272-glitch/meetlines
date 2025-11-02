import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface OrganizerStory {
  id: string;
  organizer_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  expires_at: string;
  organizer?: {
    id: string;
    page_title: string;
    avatar_url?: string;
  };
  views_count?: number;
  likes_count?: number;
  is_viewed?: boolean;
  is_liked?: boolean;
}

export interface OrganizerWithStories {
  id: string;
  page_title: string;
  avatar_url?: string;
  stories: OrganizerStory[];
  has_unviewed: boolean;
}

export function useOrganizerStories() {
  const [organizersWithStories, setOrganizersWithStories] = useState<OrganizerWithStories[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const { user } = useAuth();

  const fetchOrganizerStories = async () => {
    try {
      setLoading(true);

      // Buscar todos os stories ativos
      const { data: stories, error: storiesError } = await supabase
        .from('organizer_stories')
        .select(`
          *,
          organizer:organizers(
            id,
            page_title,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      if (!stories || stories.length === 0) {
        setOrganizersWithStories([]);
        return;
      }

      // Se o usuário estiver logado, buscar visualizações e curtidas
      let viewedStoryIds: string[] = [];
      let likedStoryIds: string[] = [];

      if (user) {
        const { data: views } = await supabase
          .from('organizer_story_views')
          .select('story_id')
          .eq('viewer_id', user.id);
        
        viewedStoryIds = views?.map(v => v.story_id) || [];

        const { data: likes } = await supabase
          .from('organizer_story_likes')
          .select('story_id')
          .eq('user_id', user.id);
        
        likedStoryIds = likes?.map(l => l.story_id) || [];
      }

      // Buscar contagens de views e likes para cada story
      const storiesWithStats = await Promise.all(
        stories.map(async (story: any) => {
          const { count: viewsCount } = await supabase
            .from('organizer_story_views')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id);

          const { count: likesCount } = await supabase
            .from('organizer_story_likes')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id);

          return {
            ...story,
            views_count: viewsCount || 0,
            likes_count: likesCount || 0,
            is_viewed: viewedStoryIds.includes(story.id),
            is_liked: likedStoryIds.includes(story.id),
          };
        })
      );

      // Agrupar stories por organizador
      const organizersMap = new Map<string, OrganizerWithStories>();

      storiesWithStats.forEach((story: any) => {
        const organizerId = story.organizer.id;
        
        if (!organizersMap.has(organizerId)) {
          organizersMap.set(organizerId, {
            id: organizerId,
            page_title: story.organizer.page_title,
            avatar_url: story.organizer.avatar_url,
            stories: [],
            has_unviewed: false,
          });
        }

        const organizer = organizersMap.get(organizerId)!;
        organizer.stories.push(story);
        
        if (!story.is_viewed) {
          organizer.has_unviewed = true;
        }
      });

      setOrganizersWithStories(Array.from(organizersMap.values()));
    } catch (error) {
      console.error('Error fetching organizer stories:', error);
      toast.error('Erro ao carregar stories');
    } finally {
      setLoading(false);
    }
  };

  const createStory = async (organizerId: string, file: File) => {
    if (!user) {
      toast.error('Faça login para criar stories');
      return null;
    }

    setUploadingStory(true);

    try {
      // Upload do arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `organizer-stories/${organizerId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName);

      // Determinar tipo de mídia
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      // Criar story no banco
      const { data: story, error: insertError } = await supabase
        .from('organizer_stories')
        .insert({
          organizer_id: organizerId,
          media_url: publicUrl,
          media_type: mediaType,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Story publicado com sucesso!');
      await fetchOrganizerStories();
      return story;
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Erro ao criar story');
      return null;
    } finally {
      setUploadingStory(false);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('organizer_stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      toast.success('Story excluído com sucesso!');
      await fetchOrganizerStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Erro ao excluir story');
    }
  };

  const markAsViewed = async (storyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('organizer_story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id,
        });

      // Ignorar erro de duplicata (usuário já visualizou)
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }

      // Atualizar estado local
      setOrganizersWithStories(prev =>
        prev.map(org => ({
          ...org,
          stories: org.stories.map(s =>
            s.id === storyId ? { ...s, is_viewed: true } : s
          ),
          has_unviewed: org.stories.some(s => s.id !== storyId && !s.is_viewed),
        }))
      );
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  };

  const toggleLike = async (storyId: string) => {
    if (!user) {
      toast.error('Faça login para curtir stories');
      return;
    }

    try {
      const story = organizersWithStories
        .flatMap(o => o.stories)
        .find(s => s.id === storyId);

      if (!story) return;

      if (story.is_liked) {
        // Remover curtida
        const { error } = await supabase
          .from('organizer_story_likes')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Adicionar curtida
        const { error } = await supabase
          .from('organizer_story_likes')
          .insert({
            story_id: storyId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      // Atualizar estado local
      setOrganizersWithStories(prev =>
        prev.map(org => ({
          ...org,
          stories: org.stories.map(s =>
            s.id === storyId
              ? {
                  ...s,
                  is_liked: !s.is_liked,
                  likes_count: s.is_liked
                    ? (s.likes_count || 0) - 1
                    : (s.likes_count || 0) + 1,
                }
              : s
          ),
        }))
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Erro ao curtir story');
    }
  };

  useEffect(() => {
    fetchOrganizerStories();

    // Atualizar a cada 60 segundos
    const interval = setInterval(fetchOrganizerStories, 60000);

    return () => clearInterval(interval);
  }, [user]);

  // Realtime updates para novos stories
  useEffect(() => {
    const channel = supabase
      .channel('organizer-stories-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'organizer_stories' }, () => {
        fetchOrganizerStories();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'organizer_stories' }, () => {
        fetchOrganizerStories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    organizersWithStories,
    loading,
    uploadingStory,
    createStory,
    deleteStory,
    markAsViewed,
    toggleLike,
    fetchOrganizerStories,
  };
}
