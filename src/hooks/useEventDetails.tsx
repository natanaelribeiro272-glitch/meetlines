import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EventComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user?: {
    display_name?: string;
    avatar_url?: string;
  };
}

export interface EventDetailsData {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  event_date: string;
  location: string;
  location_link?: string;
  max_attendees?: number;
  current_attendees: number;
  is_live: boolean;
  status: string;
  organizer_id: string;
  interests?: string[];
  organizer?: {
    id: string;
    page_title: string;
    user_id: string;
    profile?: {
      display_name?: string;
      avatar_url?: string;
      notes?: string;
    };
  };
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  comments?: EventComment[];
}

export function useEventDetails(eventId: string | null) {
  const [event, setEvent] = useState<EventDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<EventComment[]>([]);
  const { user } = useAuth();

  const fetchEventDetails = async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      
      // Buscar evento com informações do organizador
      const { data: eventData, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:organizers!inner(
            id,
            page_title,
            user_id
          )
        `)
        .eq('id', eventId)
        .maybeSingle();

      if (error) throw error;
      if (!eventData) return;

      // Buscar perfil do organizador
      const { data: organizerProfile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, notes')
        .eq('user_id', eventData.organizer.user_id)
        .maybeSingle();

      // Contar curtidas
      const { count: likesCount } = await supabase
        .from('event_likes')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      // Contar comentários
      const { count: commentsCount } = await supabase
        .from('event_comments')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      // Verificar se o usuário curtiu
      let isLiked = false;
      if (user) {
        const { data: likeData } = await supabase
          .from('event_likes')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        isLiked = !!likeData;
      }

      // Buscar comentários
      const { data: commentsData } = await supabase
        .from('event_comments')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Buscar perfis dos usuários que comentaram
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', comment.user_id)
            .maybeSingle();

          return {
            ...comment,
            user: userProfile
          };
        })
      );

      const eventWithStats = {
        ...eventData,
        organizer: {
          ...eventData.organizer,
          profile: organizerProfile
        },
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        is_liked: isLiked,
        comments: commentsWithProfiles
      };

      setEvent(eventWithStats);
      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!user || !eventId) return;

    try {
      const { data: existingLike } = await supabase
        .from('event_likes')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        await supabase
          .from('event_likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        await supabase
          .from('event_likes')
          .insert({
            event_id: eventId,
            user_id: user.id
          });
      }

      // Atualizar estado local
      if (event) {
        setEvent(prev => prev ? {
          ...prev,
          is_liked: !prev.is_liked,
          likes_count: prev.is_liked 
            ? (prev.likes_count || 0) - 1 
            : (prev.likes_count || 0) + 1
        } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const addComment = async (content: string) => {
    if (!user || !eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_comments')
        .insert({
          event_id: eventId,
          user_id: user.id,
          content
        })
        .select()
        .single();

      if (error) throw error;

      // Buscar perfil do usuário
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      const newComment = {
        ...data,
        user: userProfile
      };

      // Atualizar comentários localmente
      setComments(prev => [newComment, ...prev]);
      
      // Atualizar contador de comentários
      if (event) {
        setEvent(prev => prev ? {
          ...prev,
          comments_count: (prev.comments_count || 0) + 1
        } : null);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId, user]);

  return {
    event,
    loading,
    comments,
    toggleLike,
    addComment,
    fetchEventDetails
  };
}