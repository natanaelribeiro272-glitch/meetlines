import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useFollowers(organizerId: string | undefined) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !organizerId) {
      setLoading(false);
      return;
    }

    checkFollowStatus();
  }, [user, organizerId]);

  const checkFollowStatus = async () => {
    if (!user || !organizerId) return;

    try {
      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('user_id', user.id)
        .eq('organizer_id', organizerId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      toast.error('Faça login para seguir organizadores');
      return false;
    }

    if (!organizerId) {
      toast.error('ID do organizador não encontrado');
      return false;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('user_id', user.id)
          .eq('organizer_id', organizerId);

        if (error) throw error;

        setIsFollowing(false);
        toast.success('Você deixou de seguir este organizador');
        return true;
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            user_id: user.id,
            organizer_id: organizerId,
          });

        if (error) throw error;

        setIsFollowing(true);
        toast.success('Agora você está seguindo este organizador!');
        return true;
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error('Erro ao atualizar status de seguidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isFollowing,
    loading,
    toggleFollow,
  };
}
