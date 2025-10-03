import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EventData {
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
  organizer?: {
    id: string;
    page_title: string;
    user_id: string;
    avatar_url?: string;
    profile?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  price?: number;
  category?: string;
  registrations_count?: number;
  confirmed_attendees_count?: number;
}

export function useEvents(categoryFilter?: string, searchQuery?: string) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      let eventsData: any;
      let error: any;

      // Buscar eventos com informações do organizador
      if (categoryFilter && categoryFilter !== 'todos') {
        // Query com filtro de categoria
        // @ts-ignore - Evitar recursão infinita de tipos do Supabase
        const response = await supabase
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
          .eq('status', 'upcoming')
          .eq('category', categoryFilter)
          .order('event_date', { ascending: true });
        
        eventsData = response.data;
        error = response.error;
      } else {
        // Query sem filtro de categoria
        // @ts-ignore - Evitar recursão infinita de tipos do Supabase
        const response = await supabase
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
          .eq('status', 'upcoming')
          .order('event_date', { ascending: true });
        
        eventsData = response.data;
        error = response.error;
      }

      if (error) throw error;

      // Para cada evento, buscar estatísticas de curtidas e comentários
      const eventsWithStats = await Promise.all(
        (eventsData || []).map(async (event: any) => {
          // Buscar perfil do organizador
          const { data: organizerProfile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', event.organizer.user_id)
            .maybeSingle();

          // Contar curtidas
          const { count: likesCount } = await supabase
            .from('event_likes')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          // Contar comentários
          const { count: commentsCount } = await supabase
            .from('event_comments')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          // Contar cadastros totais
          const { count: registrationsCount } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          // Contar presenças confirmadas
          const { count: confirmedAttendeesCount } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('attendance_confirmed', true);

          // Verificar se o usuário curtiu (se logado)
          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('event_likes')
              .select('id')
              .eq('event_id', event.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            isLiked = !!likeData;
          }

          return {
            ...event,
            organizer: {
              ...event.organizer,
              profile: {
                display_name: organizerProfile?.display_name,
                avatar_url: event.organizer.avatar_url || organizerProfile?.avatar_url
              }
            },
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            is_liked: isLiked,
            registrations_count: registrationsCount || 0,
            confirmed_attendees_count: confirmedAttendeesCount || 0,
          };
        })
      );

      // Aplicar filtro de pesquisa no lado do cliente
      let filteredEvents = eventsWithStats;
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        filteredEvents = eventsWithStats.filter(event => {
          const titleMatch = event.title.toLowerCase().includes(query);
          const descriptionMatch = event.description?.toLowerCase().includes(query);
          const organizerNameMatch = event.organizer?.page_title.toLowerCase().includes(query);
          const organizerDisplayNameMatch = event.organizer?.profile?.display_name?.toLowerCase().includes(query);
          const locationMatch = event.location.toLowerCase().includes(query);
          const categoryMatch = event.category?.toLowerCase().includes(query);
          
          return titleMatch || descriptionMatch || organizerNameMatch || organizerDisplayNameMatch || locationMatch || categoryMatch;
        });
      }
      
      setEvents(filteredEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (eventId: string) => {
    if (!user) return;

    try {
      // Verificar se já curtiu
      const { data: existingLike } = await supabase
        .from('event_likes')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        // Remover curtida
        await supabase
          .from('event_likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        // Adicionar curtida
        await supabase
          .from('event_likes')
          .insert({
            event_id: eventId,
            user_id: user.id
          });
      }

      // Atualizar estado local
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              is_liked: !event.is_liked,
              likes_count: event.is_liked 
                ? (event.likes_count || 0) - 1 
                : (event.likes_count || 0) + 1
            }
          : event
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, categoryFilter, searchQuery]);

  // Realtime updates for organizer profile/name/avatar changes
  useEffect(() => {
    const channel = supabase
      .channel('realtime-organizer-profile-events')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const p = payload.new as any;
        setEvents(prev => prev.map(ev => {
          if (ev.organizer?.user_id === p.user_id) {
            return {
              ...ev,
              organizer: {
                ...ev.organizer,
                profile: {
                  ...(ev.organizer.profile || {}),
                  display_name: p.display_name ?? ev.organizer.profile?.display_name,
                  avatar_url: p.avatar_url ?? ev.organizer.profile?.avatar_url,
                },
              },
            };
          }
          return ev;
        }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'organizers' }, (payload) => {
        const o = payload.new as any;
        setEvents(prev => prev.map(ev => {
          if (ev.organizer?.id === o.id) {
            return {
              ...ev,
              organizer: {
                ...ev.organizer,
                page_title: o.page_title ?? ev.organizer.page_title,
                avatar_url: o.avatar_url ?? ev.organizer.avatar_url,
                profile: {
                  ...(ev.organizer.profile || {}),
                  avatar_url: o.avatar_url ?? ev.organizer.profile?.avatar_url,
                },
              },
            };
          }
          return ev;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime updates for event registrations
  useEffect(() => {
    const channel = supabase
      .channel('realtime-event-registrations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_registrations' }, async (payload) => {
        const registration = payload.new as any;
        const eventId = registration.event_id;
        
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

        setEvents(prev => prev.map(ev => 
          ev.id === eventId 
            ? { 
                ...ev, 
                registrations_count: registrationsCount || 0,
                confirmed_attendees_count: confirmedAttendeesCount || 0,
              }
            : ev
        ));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_registrations' }, async (payload) => {
        const registration = payload.new as any;
        const eventId = registration.event_id;
        
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

        setEvents(prev => prev.map(ev => 
          ev.id === eventId 
            ? { 
                ...ev, 
                registrations_count: registrationsCount || 0,
                confirmed_attendees_count: confirmedAttendeesCount || 0,
              }
            : ev
        ));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    events,
    loading,
    fetchEvents,
    toggleLike
  };
}
