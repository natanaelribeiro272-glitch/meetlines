import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useFriendRequest() {
  const [loading, setLoading] = useState(false);

  const acceptFriendRequest = async (friendshipId: string, requesterId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Find the friendship by requester ID and current user as friend
      const { data: friendship, error: fetchError } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', requesterId)
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!friendship) throw new Error('Friendship request not found');

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendship.id);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Find the friendship by requester ID and current user as friend
      const { data: friendship, error: fetchError } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', requesterId)
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!friendship) throw new Error('Friendship request not found');

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendship.id);

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
