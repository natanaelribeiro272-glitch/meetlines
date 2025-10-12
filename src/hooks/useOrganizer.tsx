import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface OrganizerData {
  id: string;
  user_id: string;
  username: string;
  page_title: string;
  page_subtitle?: string;
  page_description?: string;
  theme: string;
  primary_color: string;
  cover_image_url?: string;
  avatar_url?: string;
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
  notify_new_registrations?: boolean;
  notify_event_reminders?: boolean;
  public_page_visible?: boolean;
  category?: string;
}

interface Event {
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
  interests?: string[];
  is_live: boolean;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  requires_registration: boolean;
  category?: string;
  form_fields?: any[];
  ticket_price?: number;
  ticket_link?: string;
}

interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

export function useOrganizer() {
  const { user } = useAuth();
  const [organizerData, setOrganizerData] = useState<OrganizerData | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrganizerData();
    }
  }, [user]);

  const fetchOrganizerData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch organizer profile
      const { data: organizer, error: organizerError } = await supabase
        .from('organizers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (organizerError && organizerError.code !== 'PGRST116') {
        throw organizerError;
      }

      if (!organizer) {
        // Não criar perfil automaticamente mais
        // O usuário será direcionado para onboarding
        setLoading(false);
        return;
      }

      setOrganizerData(organizer);

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', organizer.id)
        .order('event_date', { ascending: true });

      setEvents(eventsData?.map(event => ({
        ...event,
        status: event.status as 'upcoming' | 'live' | 'completed' | 'cancelled',
        form_fields: (event.form_fields as any) || []
      })) || []);

      // Fetch custom links
      const { data: linksData, error: linksError } = await supabase
        .from('custom_links')
        .select('*')
        .eq('organizer_id', organizer.id)
        .order('sort_order', { ascending: true });

      if (linksError) throw linksError;
      setCustomLinks(linksData || []);

    } catch (error: any) {
      console.error('Error fetching organizer data:', error);
      toast.error('Erro ao carregar dados do organizador');
    } finally {
      setLoading(false);
    }
  };

  const updateOrganizerProfile = async (updates: Partial<OrganizerData>) => {
    if (!organizerData) return;

    try {
      const { error } = await supabase
        .from('organizers')
        .update(updates)
        .eq('id', organizerData.id);

      if (error) {
        // Verificar se é erro de username duplicado
        if (error.code === '23505' && error.message.includes('username')) {
          toast.error('Este username já está em uso. Escolha outro.');
          throw error;
        }
        throw error;
      }

      setOrganizerData(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating organizer profile:', error);
      if (!error.message.includes('username')) {
        toast.error('Erro ao atualizar perfil');
      }
      throw error;
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'current_attendees'>) => {
    if (!organizerData) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          organizer_id: organizerData.id,
          current_attendees: 0
        })
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [...prev, {
        ...data,
        status: data.status as 'upcoming' | 'live' | 'completed' | 'cancelled',
        form_fields: (data.form_fields as any) || []
      }]);
      toast.success('Evento criado com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error('Erro ao criar evento');
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    try {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, ...updates } : event
      ));
      toast.success('Evento atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error('Erro ao atualizar evento');
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== eventId));
      toast.success('Evento excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error('Erro ao excluir evento');
    }
  };

  const addCustomLink = async (linkData: Omit<CustomLink, 'id' | 'sort_order'>) => {
    if (!organizerData) return;

    try {
      const maxOrder = Math.max(...customLinks.map(link => link.sort_order), -1);
      
      const { data, error } = await supabase
        .from('custom_links')
        .insert({
          ...linkData,
          organizer_id: organizerData.id,
          sort_order: maxOrder + 1
        })
        .select()
        .single();

      if (error) throw error;

      setCustomLinks(prev => [...prev, data]);
      toast.success('Link adicionado com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Error adding custom link:', error);
      toast.error('Erro ao adicionar link');
    }
  };

  const updateCustomLink = async (linkId: string, updates: Partial<CustomLink>) => {
    try {
      const { error } = await supabase
        .from('custom_links')
        .update(updates)
        .eq('id', linkId);

      if (error) throw error;

      setCustomLinks(prev => prev.map(link => 
        link.id === linkId ? { ...link, ...updates } : link
      ));
      toast.success('Link atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating custom link:', error);
      toast.error('Erro ao atualizar link');
    }
  };

  const deleteCustomLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('custom_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setCustomLinks(prev => prev.filter(link => link.id !== linkId));
      toast.success('Link excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting custom link:', error);
      toast.error('Erro ao excluir link');
    }
  };

  return {
    organizerData,
    events,
    customLinks,
    loading,
    updateOrganizerProfile,
    createEvent,
    updateEvent,
    deleteEvent,
    addCustomLink,
    updateCustomLink,
    deleteCustomLink,
    refetch: fetchOrganizerData
  };
}