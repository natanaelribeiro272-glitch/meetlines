import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Load initial unread count
    const loadUnreadCount = async () => {
      const { count, error } = await supabase
        .from('user_messages')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', user.id)
        .eq('read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    loadUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages'
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.to_user_id === user.id && !newMessage.read) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_messages'
        },
        (payload) => {
          const updatedMessage = payload.new as any;
          const oldMessage = payload.old as any;
          
          // If message was marked as read
          if (updatedMessage.to_user_id === user.id && !oldMessage.read && updatedMessage.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
}
