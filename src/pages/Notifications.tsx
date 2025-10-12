import { Bell, Calendar, AlertCircle, X, UserPlus, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useFriendRequest } from "@/hooks/useFriendRequest";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { acceptFriendRequest, declineFriendRequest, loading: requestLoading } = useFriendRequest();
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, any>>({});

  // Fetch requester profiles for friend requests
  useEffect(() => {
    const fetchRequesterProfiles = async () => {
      const friendRequests = notifications.filter(n => n.type === 'friend_request');
      if (friendRequests.length === 0) return;

      for (const notification of friendRequests) {
        const { data: friendships } = await supabase
          .from('friendships')
          .select('user_id')
          .eq('friend_id', user?.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (friendships) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url, interest, relationship_status')
            .eq('user_id', friendships.user_id)
            .single();

          if (profile) {
            setRequesterProfiles(prev => ({
              ...prev,
              [notification.id]: { ...profile, friendshipUserId: friendships.user_id }
            }));
          }
        }
      }
    };

    if (user && notifications.length > 0) {
      fetchRequesterProfiles();
    }
  }, [notifications, user]);

  const getIcon = (type: string) => {
    switch (type) {
      case "event_created":
        return Calendar;
      case "event_updated":
        return AlertCircle;
      case "event_cancelled":
        return X;
      case "friend_request":
        return UserPlus;
      default:
        return Bell;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return 'recentemente';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (notification.type === 'friend_request') {
      await markAsRead(notification.id);
      return;
    }

    await markAsRead(notification.id);
    
    if (notification.type === 'user_message') {
      navigate('/find-friends');
    } else if (notification.type === 'user_like') {
      navigate('/find-friends');
    } else if (notification.event_id) {
      navigate(`/event/${notification.event_id}`);
    }
  };

  const handleAcceptRequest = async (notificationId: string, requesterId: string) => {
    const success = await acceptFriendRequest('', requesterId);
    if (success) {
      deleteNotification(notificationId);
    }
  };

  const handleDeclineRequest = async (notificationId: string, requesterId: string) => {
    const success = await declineFriendRequest('', requesterId);
    if (success) {
      deleteNotification(notificationId);
    }
  };

  const getRelationshipLabel = (status: string) => {
    const labels: Record<string, string> = {
      'solteiro': 'Solteiro(a)',
      'relacionamento': 'Em relacionamento',
      'casado': 'Casado(a)',
      'preferencia_nao_informar': 'Prefiro não informar'
    };
    return labels[status] || status;
  };

  const getInterestLabel = (interest: string) => {
    const labels: Record<string, string> = {
      'curtição': 'Curtição',
      'namoro': 'Namoro',
      'amizade': 'Amizade'
    };
    return labels[interest] || interest;
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
            </div>
            {notifications.some(n => !n.read) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-lg">Carregando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhuma notificação</p>
            <p className="text-sm">Você está em dia!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const isFriendRequest = notification.type === 'friend_request';
              const requesterProfile = isFriendRequest ? requesterProfiles[notification.id] : null;
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 ${isFriendRequest ? '' : 'hover:bg-surface cursor-pointer'} transition-colors group ${
                    !notification.read ? "bg-primary/5 border-l-4 border-l-primary" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {isFriendRequest && requesterProfile ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={requesterProfile.avatar_url} />
                          <AvatarFallback>
                            {requesterProfile.display_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-base font-semibold text-foreground">
                                {requesterProfile.display_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {getInterestLabel(requesterProfile.interest)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {getRelationshipLabel(requesterProfile.relationship_status)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 ml-[72px]">
                        <Button
                          size="default"
                          className="flex-1"
                          onClick={() => handleAcceptRequest(notification.id, requesterProfile.friendshipUserId)}
                          disabled={requestLoading}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Aceitar
                        </Button>
                        <Button
                          size="default"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDeclineRequest(notification.id, requesterProfile.friendshipUserId)}
                          disabled={requestLoading}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${
                        !notification.read ? "bg-primary/20" : "bg-surface"
                      }`}>
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-base font-medium text-foreground mb-1">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
