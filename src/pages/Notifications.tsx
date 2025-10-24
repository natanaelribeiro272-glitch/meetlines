import { Bell, Calendar, AlertCircle, X, UserPlus, Check, ArrowLeft, Heart, MessageCircle } from "lucide-react";
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
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});

  const todayNotifications = notifications.filter(n => {
    const date = new Date(n.created_at);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  });

  const yesterdayNotifications = notifications.filter(n => {
    const date = new Date(n.created_at);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  });

  const olderNotifications = notifications.filter(n => {
    const date = new Date(n.created_at);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date < yesterday && date.toDateString() !== yesterday.toDateString();
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      const friendRequests = notifications.filter(n => n.type === 'friend_request');
      const userInteractions = notifications.filter(n => ['user_like', 'user_message', 'event_like'].includes(n.type));

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
            .maybeSingle();

          if (profile) {
            setRequesterProfiles(prev => ({
              ...prev,
              [notification.id]: { ...profile, friendshipUserId: friendships.user_id }
            }));
          }
        }
      }

      const userIds = userInteractions
        .map(n => {
          try {
            const data = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
            return data?.from_user_id || data?.user_id;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        if (profiles) {
          const profileMap: Record<string, any> = {};
          profiles.forEach(p => {
            profileMap[p.user_id] = p;
          });
          setUserProfiles(profileMap);
        }
      }
    };

    if (user && notifications.length > 0) {
      fetchProfiles();
    }
  }, [notifications, user]);

  const getUserAvatar = (notification: any) => {
    if (notification.type === 'friend_request') {
      return requesterProfiles[notification.id]?.avatar_url;
    }

    try {
      const data = typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data;
      const userId = data?.from_user_id || data?.user_id;
      return userId ? userProfiles[userId]?.avatar_url : null;
    } catch {
      return null;
    }
  };

  const getUserName = (notification: any) => {
    if (notification.type === 'friend_request') {
      return requesterProfiles[notification.id]?.display_name || 'Usuário';
    }

    try {
      const data = typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data;
      const userId = data?.from_user_id || data?.user_id;
      return userId ? userProfiles[userId]?.display_name || 'Usuário' : 'Usuário';
    } catch {
      return 'Usuário';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "event_created":
      case "event_updated":
      case "event_cancelled":
        return Calendar;
      case "friend_request":
        return UserPlus;
      case "user_like":
      case "event_like":
        return Heart;
      case "user_message":
        return MessageCircle;
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
      navigate(`/e/${notification.event_id}`);
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

  const renderNotificationSection = (sectionNotifications: any[], title: string) => {
    if (sectionNotifications.length === 0) return null;

    return (
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground px-4 py-3 sticky top-[73px] bg-background z-10">
          {title}
        </h2>
        <div>
          {sectionNotifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const isFriendRequest = notification.type === 'friend_request';
              const requesterProfile = isFriendRequest ? requesterProfiles[notification.id] : null;
              const userAvatar = getUserAvatar(notification);
              const userName = getUserName(notification);
              const isUserInteraction = ['user_like', 'user_message', 'event_like', 'friend_request'].includes(notification.type);

              return (
                <div
                  key={notification.id}
                  className={`px-4 py-3 ${isFriendRequest ? '' : 'hover:bg-surface/50 cursor-pointer'} transition-colors group ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      {isUserInteraction && userAvatar ? (
                        <>
                          <Avatar className="h-12 w-12 border-2 border-background">
                            <AvatarImage src={userAvatar} alt={userName} />
                            <AvatarFallback className="bg-surface">
                              {userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center ${
                            notification.type === 'user_like' || notification.type === 'event_like' ? 'bg-red-500' :
                            notification.type === 'user_message' ? 'bg-blue-500' :
                            'bg-primary'
                          }`}>
                            <Icon className="h-3.5 w-3.5 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          !notification.read ? "bg-primary/20" : "bg-surface"
                        }`}>
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {isFriendRequest && requesterProfile ? (
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-semibold text-foreground">{userName}</span>
                                {' '}solicitou seguir você.
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {getInterestLabel(requesterProfile.interest)} • {getRelationshipLabel(requesterProfile.relationship_status)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 ml-2 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex gap-3 mt-3">
                            <Button
                              size="sm"
                              className="flex-1 h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptRequest(notification.id, requesterProfile.friendshipUserId);
                              }}
                              disabled={requestLoading}
                            >
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeclineRequest(notification.id, requesterProfile.friendshipUserId);
                              }}
                              disabled={requestLoading}
                            >
                              Recusar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm">
                              {isUserInteraction ? (
                                <>
                                  <span className="font-semibold text-foreground">{userName}</span>
                                  {' '}{notification.message || notification.title}
                                </>
                              ) : (
                                <span className="text-foreground">{notification.title || notification.message}</span>
                              )}
                            </p>
                            {notification.message && !isUserInteraction && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 ml-2 flex-shrink-0" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Notificações</h1>
          </div>
        </div>
      </div>

      <div className="pb-20">
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
          <>
            {renderNotificationSection(todayNotifications, 'Hoje')}
            {renderNotificationSection(yesterdayNotifications, 'Ontem')}
            {renderNotificationSection(olderNotifications, 'Últimos 7 dias')}
          </>
        )}
      </div>
    </div>
  );
}
