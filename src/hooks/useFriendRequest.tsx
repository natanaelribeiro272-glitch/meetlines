import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useFriendRequest() {
  const [loading, setLoading] = useState(false);

  const acceptFriendRequest = async (friendshipId: string, requesterId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .or(`and(id.eq.${friendshipId}),and(user_id.eq.${requesterId})`);

      if (error) throw error;

      toast.success('Solicitação aceita!');
      return true;
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      toast.error('Erro ao aceitar solicitação');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const declineFriendRequest = async (friendshipId: string, requesterId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(id.eq.${friendshipId}),and(user_id.eq.${requesterId})`);

      if (error) throw error;

      toast.success('Solicitação recusada');
      return true;
    } catch (error: any) {
      console.error('Error declining friend request:', error);
      toast.error('Erro ao recusar solicitação');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    acceptFriendRequest,
    declineFriendRequest,
  };
}
