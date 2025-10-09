import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  read: boolean;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

interface GroupedMessages {
  [userId: string]: {
    user: {
      display_name: string;
      avatar_url: string;
    };
    messages: SupportMessage[];
  };
}

export default function AdminSupport() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [groupedMessages, setGroupedMessages] = useState<GroupedMessages>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchMessages();

    const channel = supabase
      .channel('support-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_messages'
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, navigate]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          profiles (display_name, avatar_url)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const grouped: GroupedMessages = {};
      data?.forEach((msg: SupportMessage) => {
        if (!grouped[msg.user_id]) {
          grouped[msg.user_id] = {
            user: msg.profiles,
            messages: []
          };
        }
        grouped[msg.user_id].messages.push(msg);
      });

      setGroupedMessages(grouped);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedUserId || !replyText.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from('support_messages').insert({
        user_id: selectedUserId,
        message: replyText,
        is_admin_reply: true
      });

      if (error) throw error;

      setReplyText('');
      toast.success('Resposta enviada!');
      fetchMessages();
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (userId: string) => {
    try {
      await supabase
        .from('support_messages')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('is_admin_reply', false);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  if (!isAdmin) return null;

  const selectedMessages = selectedUserId ? groupedMessages[selectedUserId]?.messages || [] : [];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <h1 className="text-3xl font-bold mb-6">Chat de Suporte</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Users list */}
        <Card className="md:col-span-1">
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold mb-4">Conversas</h2>
            {loading ? (
              <div>Carregando...</div>
            ) : Object.keys(groupedMessages).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma mensagem</p>
            ) : (
              Object.entries(groupedMessages).map(([userId, data]) => {
                const unread = data.messages.filter(m => !m.is_admin_reply && !m.read).length;
                return (
                  <div
                    key={userId}
                    onClick={() => {
                      setSelectedUserId(userId);
                      markAsRead(userId);
                    }}
                    className={`p-3 rounded cursor-pointer hover:bg-accent ${
                      selectedUserId === userId ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {data.user.avatar_url && (
                        <img src={data.user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{data.user.display_name}</p>
                        {unread > 0 && (
                          <span className="text-xs text-primary">{unread} nova(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            {selectedUserId ? (
              <div className="space-y-4">
                <div className="h-[400px] overflow-y-auto space-y-3 mb-4">
                  {selectedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin_reply ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-lg ${
                        msg.is_admin_reply ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Digite sua resposta..."
                    rows={3}
                  />
                  <Button onClick={handleSendReply} disabled={sending || !replyText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Selecione uma conversa
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
