import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OrganizerListData {
  id: string;
  page_title: string;
  page_subtitle?: string;
  page_description?: string;
  username: string;
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
  };
  verified?: boolean;
  category?: string;
}

export function useOrganizersList() {
  const { user } = useAuth();
  const [organizers, setOrganizers] = useState<OrganizerListData[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserInterests = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.interests && Array.isArray(profile.interests)) {
        setUserInterests(profile.interests);
      }
    };

    fetchUserInterests();
  }, [user]);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);

      // Buscar organizadores ativos
      let query = supabase
        .from('organizers')
        .select(`
          *,
          stats:organizer_stats(
            followers_count,
            events_count
          )
        `)
        .eq('is_page_active', true);

      // Se o usuário tem interesses, filtrar organizadores por categoria
      if (userInterests.length > 0) {
        // Se o usuário tem interesse em "outros", também incluir NULL
        if (userInterests.includes('outros')) {
          query = query.or(`category.in.(${userInterests.join(',')}),category.is.null`);
        } else {
          query = query.in('category', userInterests);
        }
      }

      const { data: organizersData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Para cada organizador, buscar seu perfil
      const processedOrganizers = await Promise.all(
        (organizersData || []).map(async (organizer) => {
          // Buscar perfil e contagens em paralelo para garantir dados corretos
          const [profileRes, followersRes, eventsRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('display_name, avatar_url, bio')
              .eq('user_id', organizer.user_id)
              .maybeSingle(),
            supabase
              .from('followers')
              .select('id', { count: 'exact', head: true })
              .eq('organizer_id', organizer.id),
            supabase
              .from('events')
              .select('id', { count: 'exact', head: true })
              .eq('organizer_id', organizer.id),
          ]);

          const profile = profileRes.data;
          const followers_count = followersRes.count ?? 0;
          const events_count = eventsRes.count ?? 0;

          return {
            ...organizer,
            profile,
            verified: Math.random() > 0.5, // Mock - pode ser implementado depois
            category: organizer.category || "outros",
            stats: {
              followers_count,
              events_count
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
    if (user) {
      fetchOrganizers();
    }
  }, [user, userInterests]);

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
      // Atualizar contagem de seguidores em tempo real
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'followers' }, (payload) => {
        const f = payload.new as any;
        setOrganizers(prev => prev.map(org => {
          if (org.id === f.organizer_id) {
            const current = org.stats?.followers_count ?? 0;
            return {
              ...org,
              stats: { followers_count: current + 1, events_count: org.stats?.events_count ?? 0 }
            };
          }
          return org;
        }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'followers' }, (payload) => {
        const f = payload.old as any;
        setOrganizers(prev => prev.map(org => {
          if (org.id === f.organizer_id) {
            const current = org.stats?.followers_count ?? 0;
            return {
              ...org,
              stats: { followers_count: Math.max(0, current - 1), events_count: org.stats?.events_count ?? 0 }
            };
          }
          return org;
        }));
      })
      // Atualizar contagem de eventos em tempo real
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
        const e = payload.new as any;
        setOrganizers(prev => prev.map(org => {
          if (org.id === e.organizer_id) {
            const current = org.stats?.events_count ?? 0;
            return {
              ...org,
              stats: { followers_count: org.stats?.followers_count ?? 0, events_count: current + 1 }
            };
          }
          return org;
        }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'events' }, (payload) => {
        const e = payload.old as any;
        setOrganizers(prev => prev.map(org => {
          if (org.id === e.organizer_id) {
            const current = org.stats?.events_count ?? 0;
            return {
              ...org,
              stats: { followers_count: org.stats?.followers_count ?? 0, events_count: Math.max(0, current - 1) }
            };
          }
          return org;
        }));
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