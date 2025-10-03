import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizerListData {
  id: string;
  page_title: string;
  page_subtitle?: string;
  page_description?: string;
  slug: string;
  primary_color: string;
  cover_image_url?: string;
  avatar_url?: string;
  updated_at?: string;
  user_id: string;
  profile?: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  };
  stats?: {
    followers_count: number;
    events_count: number;
    average_rating: number;
  };
  verified?: boolean;
  category?: string;
}

export function useOrganizersList() {
  const [organizers, setOrganizers] = useState<OrganizerListData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      
      // Buscar organizadores ativos
      const { data: organizersData, error } = await supabase
        .from('organizers')
        .select(`
          *,
          stats:organizer_stats(
            followers_count,
            events_count,
            average_rating
          )
        `)
        .eq('is_page_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Para cada organizador, buscar seu perfil
      const processedOrganizers = await Promise.all(
        (organizersData || []).map(async (organizer) => {
          // Buscar perfil do organizador
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, bio')
            .eq('user_id', organizer.user_id)
            .maybeSingle();

          return {
            ...organizer,
            profile,
            verified: Math.random() > 0.5, // Mock - pode ser implementado depois
            category: organizer.page_subtitle || "Entretenimento", // Mock - pode ser adicionado ao banco
            stats: Array.isArray(organizer.stats) && organizer.stats.length > 0 
              ? organizer.stats[0] 
              : {
                  followers_count: 0,
                  events_count: 0,
                  average_rating: 0
                }
          };
        })
      );

      setOrganizers(processedOrganizers);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  // Realtime updates to reflect profile/organizer changes instantly in the list
  useEffect(() => {
    const channel = supabase
      .channel('realtime-organizer-list')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const p = payload.new as any;
        setOrganizers(prev => prev.map(org => {
          if (org.user_id === p.user_id) {
            return {
              ...org,
              profile: {
                ...(org.profile || {}),
                display_name: p.display_name ?? org.profile?.display_name,
                avatar_url: p.avatar_url ?? org.profile?.avatar_url,
                bio: p.bio ?? org.profile?.bio,
              }
            };
          }
          return org;
        }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'organizers' }, (payload) => {
        const o = payload.new as any;
        setOrganizers(prev => prev.map(org => org.id === o.id ? {
          ...org,
          page_title: o.page_title ?? org.page_title,
          avatar_url: o.avatar_url ?? org.avatar_url,
          page_description: o.page_description ?? org.page_description,
          updated_at: o.updated_at ?? org.updated_at
        } : org));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    organizers,
    loading,
    fetchOrganizers
  };
}