import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizerDetailsData {
  id: string;
  user_id: string;
  slug: string;
  page_title: string;
  page_subtitle?: string;
  page_description?: string;
  theme: string;
  primary_color: string;
  cover_image_url?: string;
  show_statistics: boolean;
  show_events: boolean;
  show_contact: boolean;
  is_page_active: boolean;
  created_at: string;
  updated_at: string;
  whatsapp_url?: string;
  instagram_url?: string;
  playlist_url?: string;
  location_url?: string;
  website_url?: string;
  show_whatsapp?: boolean;
  show_instagram?: boolean;
  show_playlist?: boolean;
  show_location?: boolean;
  show_website?: boolean;
  profile?: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  };
  stats?: {
    followers_count: number;
    events_count: number;
    average_rating: number;
    total_ratings: number;
  };
}

export interface OrganizerEvent {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  event_date: string;
  location: string;
  max_attendees?: number;
  current_attendees: number;
  is_live: boolean;
  status: string;
  likes_count?: number;
  comments_count?: number;
}

export interface OrganizerLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

export function useOrganizerDetails(organizerId: string | null) {
  const [organizer, setOrganizer] = useState<OrganizerDetailsData | null>(null);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [customLinks, setCustomLinks] = useState<OrganizerLink[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrganizerDetails = async () => {
    if (!organizerId) return;
    
    try {
      setLoading(true);
      
      // Buscar organizador
      const { data: organizerData, error: organizerError } = await supabase
        .from('organizers')
        .select('*')
        .eq('id', organizerId)
        .eq('is_page_active', true)
        .maybeSingle();

      if (organizerError) throw organizerError;
      if (!organizerData) return;

      // Buscar perfil do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, bio')
        .eq('user_id', organizerData.user_id)
        .maybeSingle();

      // Buscar estatísticas
      const { data: statsData } = await supabase
        .from('organizer_stats')
        .select('*')
        .eq('organizer_id', organizerId)
        .maybeSingle();

      const organizerWithDetails = {
        ...organizerData,
        profile: profileData,
        stats: statsData || {
          followers_count: 0,
          events_count: 0,
          average_rating: 0,
          total_ratings: 0
        }
      };

      setOrganizer(organizerWithDetails);

      // Buscar eventos públicos do organizador
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', organizerId)
        .eq('status', 'upcoming')
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      // Para cada evento, buscar estatísticas
      const eventsWithStats = await Promise.all(
        (eventsData || []).map(async (event) => {
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

          return {
            ...event,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
          };
        })
      );

      setEvents(eventsWithStats);

      // Buscar links customizados ativos
      const { data: linksData, error: linksError } = await supabase
        .from('custom_links')
        .select('*')
        .eq('organizer_id', organizerId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (linksError) throw linksError;
      setCustomLinks(linksData || []);

    } catch (error) {
      console.error('Error fetching organizer details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizerDetails();
  }, [organizerId]);

  return {
    organizer,
    events,
    customLinks,
    loading,
    refetch: fetchOrganizerDetails
  };
}