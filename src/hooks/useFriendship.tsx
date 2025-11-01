import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useFriendship(friendId: string | undefined) {
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !friendId) {
      setLoading(false);
      return;
    }

    checkFriendshipStatus();

    // Subscribe to realtime updates for this friendship
    const channel = supabase
      .channel(`friendship-${user.id}-${friendId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${user.id},friend_id=eq.${friendId}`
        },
        (payload) => {
          console.log('Friendship change detected:', payload);
          checkFriendshipStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${friendId},friend_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Friendship change detected (reverse):', payload);
          checkFriendshipStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friendId]);

  const checkFriendshipStatus = async () => {
    if (!user || !friendId) return;

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking friendship status:', error);
      }

      setFriendshipStatus((data?.status as 'none' | 'pending' | 'accepted') || 'none');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async () => {
    if (!user) {
      toast.error('Faça login para adicionar amigos');
      return false;
    }

    if (!friendId) {
      toast.error('ID do usuário não encontrado');
      return false;
    }

    setLoading(true);

    try {
      // First check if there's already a friendship in either direction
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friendships')
        .select('id, status, user_id, friend_id')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // If friendship already exists
      if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
          toast.info('Vocês já são amigos!');
          setFriendshipStatus('accepted');
          return true;
        } else if (existingFriendship.status === 'pending') {
          // If the other person sent a request to us, accept it
          if (existingFriendship.user_id === friendId && existingFriendship.friend_id === user.id) {
            const { error: updateError } = await supabase
              .from('friendships')
              .update({ status: 'accepted' })
              .eq('id', existingFriendship.id);

            if (updateError) throw updateError;

            setFriendshipStatus('accepted');
            toast.success('Solicitação aceita!');
            return true;
          } else {
            // We already sent a request
            toast.info('Solicitação já enviada. Aguardando resposta.');
            setFriendshipStatus('pending');
            return true;
          }
        }
      }

      // Create new friendship request
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending',
        });

      if (error) throw error;

      setFriendshipStatus('pending');
      toast.success('Solicitação de amizade enviada!');
      return true;
    } catch (error: any) {
      console.error('Error adding friend:', error);
      toast.error('Erro ao adicionar amigo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async () => {
    if (!user || !friendId) return false;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

      if (error) throw error;

      setFriendshipStatus('none');
      toast.success('Amigo removido');
      return true;
    } catch (error: any) {
      console.error('Error removing friend:', error);
      toast.error('Erro ao remover amigo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    friendshipStatus,
    loading,
    addFriend,
    removeFriend,
    refreshStatus: checkFriendshipStatus,
  };
}
