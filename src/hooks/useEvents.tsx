import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { NORMALIZE_CATEGORY_MAP } from '@/constants/categories';
import { EventFilters } from '@/components/EventFiltersDialog';

export interface EventData {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  event_date: string;
  end_date?: string;
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
  ticket_price?: number;
  ticket_link?: string;
  category?: string[];
  registrations_count?: number;
  confirmed_attendees_count?: number;
  unique_attendees_count?: number;
  is_platform_event?: boolean;
  organizer_name?: string;
  has_paid_tickets?: boolean;
}

export function useEvents(categoryFilter?: string, searchQuery?: string, userInterests?: string[], filters?: EventFilters) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      let eventsData: any;
      let platformEventsData: any;
      let error: any;
      let platformError: any;

      // Buscar eventos regulares com informações do organizador
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
              avatar_url,
              username
            )
          `)
          .eq('status', 'upcoming')
          .contains('category', [categoryFilter])
          .order('event_date', { ascending: true });
        
        eventsData = response.data;
        error = response.error;

        // Buscar platform_events com filtro de categoria
        const platformResponse = await supabase
          .from('platform_events')
          .select('*')
          .eq('status', 'upcoming')
          .contains('category', [categoryFilter])
          .order('event_date', { ascending: true });
        
        platformEventsData = platformResponse.data;
        platformError = platformResponse.error;
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
              avatar_url,
              username
            )
          `)
          .eq('status', 'upcoming')
          .order('event_date', { ascending: true });
        
        eventsData = response.data;
        error = response.error;

        // Buscar platform_events sem filtro
        const platformResponse = await supabase
          .from('platform_events')
          .select('*')
          .eq('status', 'upcoming')
          .order('event_date', { ascending: true });
        
        platformEventsData = platformResponse.data;
        platformError = platformResponse.error;
      }

      if (error) throw error;
      if (platformError) throw platformError;

      // Buscar todos os dados necessários em batch para otimização
      const eventIds = (eventsData || []).map((e: any) => e.id);
      const organizerUserIds = (eventsData || []).map((e: any) => e.organizer?.user_id).filter(Boolean);

      let organizerProfiles: any[] = [];
      let likesData: any = { data: [] };
      let commentsData: any = { data: [] };
      let registrationsData: any = { data: [] };
      let ticketTypesData: any = { data: [] };
      let userLikesData: any = { data: [] };

      // Só buscar dados se houver eventos
      if (eventIds.length > 0) {
        // Buscar perfis dos organizadores em batch
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', organizerUserIds);

        organizerProfiles = profiles || [];

        // Buscar estatísticas em batch usando aggregation
        [likesData, commentsData, registrationsData, ticketTypesData, userLikesData] = await Promise.all([
          // Curtidas por evento
          supabase.rpc('get_event_likes_count', { event_ids: eventIds }),
          // Comentários por evento
          supabase.rpc('get_event_comments_count', { event_ids: eventIds }),
          // Registros por evento
          supabase.rpc('get_event_registrations_stats', { event_ids: eventIds }),
          // Tickets pagos por evento
          supabase
            .from('ticket_types')
            .select('event_id, price')
            .in('event_id', eventIds)
            .eq('is_active', true),
          // Curtidas do usuário (se logado)
          user
            ? supabase
                .from('event_likes')
                .select('event_id')
                .in('event_id', eventIds)
                .eq('user_id', user.id)
            : Promise.resolve({ data: [] })
        ]);
      }

      const profilesMap = new Map(
        organizerProfiles.map(p => [p.user_id, p])
      );

      // Criar mapas para acesso rápido
      const likesMap = new Map((likesData.data || []).map((l: any) => [l.event_id, l.count]));
      const commentsMap = new Map((commentsData.data || []).map((c: any) => [c.event_id, c.count]));
      const registrationsMap = new Map((registrationsData.data || []).map((r: any) => [r.event_id, r]));
      const userLikesSet = new Set((userLikesData.data || []).map((l: any) => l.event_id));

      const ticketsByEvent = new Map<string, any[]>();
      (ticketTypesData.data || []).forEach((ticket: any) => {
        if (!ticketsByEvent.has(ticket.event_id)) {
          ticketsByEvent.set(ticket.event_id, []);
        }
        ticketsByEvent.get(ticket.event_id)!.push(ticket);
      });

      // Processar eventos com os dados já carregados
      const eventsWithStats = (eventsData || []).map((event: any) => {
        const organizerProfile = profilesMap.get(event.organizer?.user_id);
        const eventTickets = ticketsByEvent.get(event.id) || [];
        const registrationStats = registrationsMap.get(event.id) || { total: 0, confirmed: 0, unique: 0 };

        const hasPaidTickets = eventTickets.some(t => Number(t.price) > 0) ||
                               (event.ticket_price && Number(event.ticket_price) > 0) ||
                               !!event.ticket_link;

        return {
          ...event,
          is_platform_event: false,
          organizer: {
            ...event.organizer,
            profile: {
              display_name: organizerProfile?.display_name,
              avatar_url: event.organizer.avatar_url || organizerProfile?.avatar_url
            }
          },
          likes_count: likesMap.get(event.id) || 0,
          comments_count: commentsMap.get(event.id) || 0,
          is_liked: userLikesSet.has(event.id),
          registrations_count: registrationStats.total || 0,
          confirmed_attendees_count: registrationStats.confirmed || 0,
          unique_attendees_count: registrationStats.unique || 0,
          has_paid_tickets: hasPaidTickets,
        };
      });

      // Processar platform_events
      const platformEventsWithStats = (platformEventsData || []).map((platformEvent: any) => ({
        ...platformEvent,
        is_platform_event: true,
        organizer_id: 'platform',
        organizer: {
          id: 'platform',
          page_title: platformEvent.organizer_name,
          user_id: 'platform',
          avatar_url: null,
          profile: {
            display_name: platformEvent.organizer_name,
            avatar_url: null
          }
        },
        current_attendees: 0,
        is_live: false,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
        registrations_count: 0,
        confirmed_attendees_count: 0,
        unique_attendees_count: 0,
        has_paid_tickets: (platformEvent.ticket_price && Number(platformEvent.ticket_price) > 0) || !!platformEvent.ticket_link,
      }));

      // Combinar eventos regulares e platform_events
      let allEvents = [...eventsWithStats, ...platformEventsWithStats];

      // Buscar organizadores seguidos (se logado)
      let followedOrganizerIds: string[] = [];
      if (user) {
        const { data: follows } = await supabase
          .from('followers')
          .select('organizer_id')
          .eq('user_id', user.id);
        followedOrganizerIds = (follows || []).map((f: any) => f.organizer_id);
      }
      
      // Filtrar por interesses do usuário se fornecido
      if (userInterests && userInterests.length > 0) {
        const normalizedInterests = new Set(
          userInterests.map(i => i.toLowerCase())
        );

        allEvents = allEvents.filter(event => {
          const isFollowed = followedOrganizerIds.includes(event.organizer_id);
          const normalizedEventCats = (event.category || [])
            .map((c: string) => (NORMALIZE_CATEGORY_MAP[c] ?? c).toLowerCase());
          const matchesInterest = normalizedEventCats.some(cat => normalizedInterests.has(cat));
          return isFollowed || matchesInterest;
        });
      }
      
      // Ordenar: primeiro por data, depois eventos pagos dentro da mesma data
      allEvents.sort((a, b) => {
        const dateA = new Date(a.event_date);
        const dateB = new Date(b.event_date);

        // Comparar apenas a data (sem hora)
        const dayA = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
        const dayB = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());

        // Se são datas diferentes, ordenar pela data mais próxima
        if (dayA.getTime() !== dayB.getTime()) {
          return dayA.getTime() - dayB.getTime();
        }

        // Se são do mesmo dia, priorizar eventos pagos
        if (a.has_paid_tickets && !b.has_paid_tickets) return -1;
        if (!a.has_paid_tickets && b.has_paid_tickets) return 1;

        // Se ambos têm ou não têm tickets pagos, ordenar pela hora do evento
        return dateA.getTime() - dateB.getTime();
      });

      // Aplicar filtro de pesquisa no lado do cliente
      let filteredEvents = allEvents;
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        filteredEvents = allEvents.filter(event => {
          const titleMatch = event.title.toLowerCase().includes(query);
          const descriptionMatch = event.description?.toLowerCase().includes(query);
          const organizerNameMatch = event.organizer?.page_title.toLowerCase().includes(query);
          const organizerDisplayNameMatch = event.organizer?.profile?.display_name?.toLowerCase().includes(query);
          const locationMatch = event.location.toLowerCase().includes(query);
          const categoryMatch = event.category?.some(cat => cat.toLowerCase().includes(query));

          return titleMatch || descriptionMatch || organizerNameMatch || organizerDisplayNameMatch || locationMatch || categoryMatch;
        });
      }

      // Aplicar filtros adicionais
      if (filters) {
        // Filtro de cidade
        if (!filters.showAllCities && filters.cities.length > 0) {
          const cityIds = filters.cities;
          filteredEvents = filteredEvents.filter(event => {
            // Para platform_events, não temos city_id ainda, então mantemos todos
            if (event.is_platform_event) return true;

            // Verificar se o evento está em uma das cidades selecionadas
            // TODO: Implementar busca em event_visible_cities quando disponível
            return true; // Por enquanto, mantém todos os eventos
          });
        }

        // Filtro de categorias
        if (filters.categories.length > 0) {
          filteredEvents = filteredEvents.filter(event => {
            const eventCategories = event.category || [];
            return filters.categories.some(filterCat =>
              eventCategories.some(eventCat =>
                eventCat.toLowerCase().includes(filterCat.toLowerCase()) ||
                filterCat.toLowerCase().includes(eventCat.toLowerCase())
              )
            );
          });
        }

        // Filtro de período
        if (filters.dateRange !== 'all') {
          const now = new Date();
          filteredEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.event_date);

            switch (filters.dateRange) {
              case 'today': {
                const isToday = eventDate.getDate() === now.getDate() &&
                               eventDate.getMonth() === now.getMonth() &&
                               eventDate.getFullYear() === now.getFullYear();
                return isToday;
              }
              case 'week': {
                const weekFromNow = new Date(now);
                weekFromNow.setDate(now.getDate() + 7);
                return eventDate >= now && eventDate <= weekFromNow;
              }
              case 'month': {
                const monthFromNow = new Date(now);
                monthFromNow.setMonth(now.getMonth() + 1);
                return eventDate >= now && eventDate <= monthFromNow;
              }
              default:
                return true;
            }
          });
        }
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
  }, [user, categoryFilter, searchQuery, userInterests, filters]);

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

        // Contar usuários únicos
        const { data: uniqueUsersData } = await supabase
          .from('event_registrations')
          .select('user_id')
          .eq('event_id', eventId);
        
        const uniqueAttendeesCount = new Set(uniqueUsersData?.map(r => r.user_id) || []).size;

        setEvents(prev => prev.map(ev => 
          ev.id === eventId 
            ? { 
                ...ev, 
                registrations_count: registrationsCount || 0,
                confirmed_attendees_count: confirmedAttendeesCount || 0,
                unique_attendees_count: uniqueAttendeesCount || 0,
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

        // Contar usuários únicos
        const { data: uniqueUsersData } = await supabase
          .from('event_registrations')
          .select('user_id')
          .eq('event_id', eventId);
        
        const uniqueAttendeesCount = new Set(uniqueUsersData?.map(r => r.user_id) || []).size;

        setEvents(prev => prev.map(ev => 
          ev.id === eventId 
            ? { 
                ...ev, 
                registrations_count: registrationsCount || 0,
                confirmed_attendees_count: confirmedAttendeesCount || 0,
                unique_attendees_count: uniqueAttendeesCount || 0,
              }
            : ev
        ));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime updates for new events (when claim is approved)
  useEffect(() => {
    const channel = supabase
      .channel('realtime-new-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, () => {
        // Recarregar todos os eventos quando um novo for criado
        fetchEvents();
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
