import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  session_name?: string | null;
  created_at: string;
  event_id: string | null;
}

interface PhotoSession {
  sessionName: string;
  eventName?: string;
  photos: Photo[];
  date: string;
  eventId: string | null;
}

export function useOrganizerPhotos() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizerId, setOrganizerId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrganizerAndPhotos();
    }
  }, [user]);

  const fetchOrganizerAndPhotos = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get organizer ID
      const { data: organizerData, error: orgError } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (orgError) throw orgError;
      if (!organizerData) return;

      setOrganizerId(organizerData.id);

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('organizer_photos')
        .select('*')
        .eq('organizer_id', organizerData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;

      setPhotos(photosData || []);
      await groupPhotosBySessions(photosData || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupPhotosBySessions = async (photosData: Photo[]) => {
    const sessions: { [key: string]: PhotoSession } = {};

    // Buscar nomes dos eventos para todas as fotos
    const eventIds = [...new Set(photosData.map(p => p.event_id).filter(Boolean))];
    const eventsMap: { [key: string]: string } = {};
    
    if (eventIds.length > 0) {
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);
      
      if (eventsData) {
        eventsData.forEach(event => {
          eventsMap[event.id] = event.title;
        });
      }
    }

    photosData.forEach((photo) => {
      const sessionKey = photo.event_id || 'no-event';
      
      if (!sessions[sessionKey]) {
        sessions[sessionKey] = {
          sessionName: photo.session_name || 'Sem sessão',
          eventName: photo.event_id ? eventsMap[photo.event_id] || 'Evento' : 'Sem evento',
          photos: [],
          date: new Date(photo.created_at).toLocaleDateString('pt-BR'),
          eventId: photo.event_id,
        };
      }

      sessions[sessionKey].photos.push(photo);
    });

    setPhotoSessions(Object.values(sessions));
  };

  const uploadPhotos = async (files: FileList, eventId: string) => {
    if (!organizerId || !user) {
      toast.error('Organizador não encontrado');
      return false;
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/photos/${Date.now()}_${i}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.error(`Erro ao fazer upload da foto ${i + 1}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(fileName);

        // Save to organizer_photos table
        const { error: dbError } = await supabase
          .from('organizer_photos')
          .insert({
            organizer_id: organizerId,
            photo_url: publicUrl,
            caption: file.name,
            event_id: eventId,
          });

        if (dbError) {
          console.error('Error saving photo to database:', dbError);
          toast.error(`Erro ao salvar foto ${i + 1}`);
        }
      }

      toast.success('Fotos enviadas com sucesso!');
      await fetchOrganizerAndPhotos();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao fazer upload das fotos');
      return false;
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('organizer_photos')
        .update({ is_active: false })
        .eq('id', photoId);

      if (error) throw error;

      toast.success('Foto removida com sucesso!');
      await fetchOrganizerAndPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Erro ao remover foto');
    }
  };

  return {
    photos,
    photoSessions,
    loading,
    uploadPhotos,
    deletePhoto,
    refreshPhotos: fetchOrganizerAndPhotos,
  };
}
