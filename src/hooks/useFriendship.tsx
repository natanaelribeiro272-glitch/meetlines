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
  };
}
