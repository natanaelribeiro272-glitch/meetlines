import { useRef, useEffect, useState } from "react";
import { Bell, Calendar, AlertCircle, X, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useFriendRequest } from "@/hooks/useFriendRequest";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NotificationDropdownProps {
  onUnauthorizedClick?: () => void;
}

export function NotificationDropdown({ onUnauthorizedClick }: NotificationDropdownProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { acceptFriendRequest, declineFriendRequest, loading: requestLoading } = useFriendRequest();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, any>>({});

  const newNotificationsCount = unreadCount;

  const handleClick = () => {
    if (!user) {
      if (onUnauthorizedClick) {
        onUnauthorizedClick();
      } else {
        navigate('/auth');
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch requester profiles for friend requests
  useEffect(() => {
    const fetchRequesterProfiles = async () => {
      const friendRequests = notifications.filter(n => n.type === 'friend_request');
      if (friendRequests.length === 0) return;

      for (const notification of friendRequests) {
        // Extract user_id from message
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
      // Don't close dropdown for friend requests, just mark as read
      await markAsRead(notification.id);
      return;
    }

    // Mark as read first
    await markAsRead(notification.id);
    
    // Handle navigation based on notification type
    if (notification.type === 'user_message') {
      setIsOpen(false);
      navigate('/find-friends');
    } else if (notification.type === 'user_like') {
      setIsOpen(false);
      navigate('/find-friends');
    } else if (notification.event_id) {
      // For event notifications, go to the specific event
      setIsOpen(false);
      navigate(`/event/${notification.event_id}`);
    } else {
      // For other types, just close
      setIsOpen(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative hover:bg-primary/10"
        onClick={handleClick}
      >
        <Bell className="h-5 w-5" />
        {newNotificationsCount > 0 && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full flex items-center justify-center animate-pulse">
            <span className="text-xs text-destructive-foreground font-bold">
              {newNotificationsCount}
            </span>
          </div>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden bg-background border border-border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Notificações</h3>
            {newNotificationsCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p>Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  const isFriendRequest = notification.type === 'friend_request';
                  const requesterProfile = isFriendRequest ? requesterProfiles[notification.id] : null;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 ${isFriendRequest ? '' : 'hover:bg-surface cursor-pointer'} transition-colors group ${
                        !notification.read ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {isFriendRequest && requesterProfile ? (
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={requesterProfile.avatar_url} />
                              <AvatarFallback>
                                {requesterProfile.display_name?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {requesterProfile.display_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {getInterestLabel(requesterProfile.interest)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {getRelationshipLabel(requesterProfile.relationship_status)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleAcceptRequest(notification.id, requesterProfile.friendshipUserId)}
                              disabled={requestLoading}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleDeclineRequest(notification.id, requesterProfile.friendshipUserId)}
                              disabled={requestLoading}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Recusar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className={`p-1 rounded-full ${
                            !notification.read ? "bg-primary/20" : "bg-surface"
                          }`}>
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {notification.title}
                              </p>
                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border">
              <Button 
                variant="ghost" 
                className="w-full text-sm"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
              >
                Ver todas as notificações
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}