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
  category?: string;
  requires_registration?: boolean;
  ticket_link?: string;
  organizer?: {
    id: string;
    page_title: string;
    user_id: string;
    avatar_url?: string;
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
  registrations_count?: number;
  confirmed_attendees_count?: number;
  unique_attendees_count?: number;
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
            user_id,
            avatar_url
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

      // Contar cadastros totais
      const { count: registrationsCount } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      // Contar presenças confirmadas
      const { count: confirmedAttendeesCount } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('attendance_confirmed', true);

      // Contar usuários únicos (para evitar duplicação)
      const { data: uniqueUsersData } = await supabase
        .from('event_registrations')
        .select('user_id')
        .eq('event_id', eventId);
      
      const uniqueAttendeesCount = new Set(uniqueUsersData?.map(r => r.user_id) || []).size;

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
          profile: {
            ...organizerProfile,
            avatar_url: eventData.organizer.avatar_url || organizerProfile?.avatar_url
          }
        },
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        is_liked: isLiked,
        comments: commentsWithProfiles,
        registrations_count: registrationsCount || 0,
        confirmed_attendees_count: confirmedAttendeesCount || 0,
        unique_attendees_count: uniqueAttendeesCount || 0,
        // Calculate is_live based on event date and status (same logic as EventFeed)
        is_live: (() => {
          const eventDate = new Date(eventData.event_date);
          const now = new Date();
          return eventDate <= now && eventData.status !== 'completed';
        })(),
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

  // Realtime updates for organizer profile/name/avatar changes on details page
  useEffect(() => {
    if (!event) return;

    const channel = supabase
      .channel('realtime-organizer-profile-eventdetails')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${event.organizer?.user_id}`
      }, (payload) => {
        const p = payload.new as any;
        setEvent(prev => prev ? {
          ...prev,
          organizer: {
            ...prev.organizer!,
            profile: {
              ...(prev.organizer?.profile || {}),
              display_name: p.display_name ?? prev.organizer?.profile?.display_name,
              avatar_url: p.avatar_url ?? prev.organizer?.profile?.avatar_url,
              notes: prev.organizer?.profile?.notes,
            }
          }
        } : prev);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'organizers',
        filter: `id=eq.${event.organizer?.id}`
      }, (payload) => {
        const o = payload.new as any;
        setEvent(prev => prev ? {
          ...prev,
          organizer: {
            ...prev.organizer!,
            page_title: o.page_title ?? prev.organizer?.page_title,
            avatar_url: o.avatar_url ?? prev.organizer?.avatar_url,
            profile: {
              ...(prev.organizer?.profile || {}),
              avatar_url: o.avatar_url ?? prev.organizer?.profile?.avatar_url,
            }
          }
        } : prev);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event?.organizer?.user_id, event?.organizer?.id]);

  // Realtime updates for event registrations on details page
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel('realtime-event-registrations-details')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_registrations',
        filter: `event_id=eq.${eventId}`
      }, async () => {
        // Recarregar contagens para este evento
        const { count: registrationsCount } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);

        const { count: confirmedAttendeesCount } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('attendance_confirmed', true);

        // Contar usuários únicos
        const { data: uniqueUsersData } = await supabase
          .from('event_registrations')
          .select('user_id')
          .eq('event_id', eventId);
        
        const uniqueAttendeesCount = new Set(uniqueUsersData?.map(r => r.user_id) || []).size;

        setEvent(prev => prev ? {
          ...prev,
          registrations_count: registrationsCount || 0,
          confirmed_attendees_count: confirmedAttendeesCount || 0,
          unique_attendees_count: uniqueAttendeesCount || 0,
        } : prev);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'event_registrations',
        filter: `event_id=eq.${eventId}`
      }, async () => {
        // Recarregar contagens para este evento
        const { count: registrationsCount } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);

        const { count: confirmedAttendeesCount } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('attendance_confirmed', true);

        // Contar usuários únicos
        const { data: uniqueUsersData } = await supabase
          .from('event_registrations')
          .select('user_id')
          .eq('event_id', eventId);
        
        const uniqueAttendeesCount = new Set(uniqueUsersData?.map(r => r.user_id) || []).size;

        setEvent(prev => prev ? {
          ...prev,
          registrations_count: registrationsCount || 0,
          confirmed_attendees_count: confirmedAttendeesCount || 0,
          unique_attendees_count: uniqueAttendeesCount || 0,
        } : prev);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return {
    event,
    loading,
    comments,
    toggleLike,
    addComment,
    fetchEventDetails
  };
}