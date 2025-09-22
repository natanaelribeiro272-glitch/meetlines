import { useState, useRef, useEffect } from "react";
import { Bell, Users, Calendar, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "event" | "friend" | "like" | "reminder";
  title: string;
  message: string;
  time: string;
  isNew: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "event",
    title: "Novo evento na sua área",
    message: "Festival de Rock acontece amanhã às 20h",
    time: "há 2 min",
    isNew: true
  },
  {
    id: "2", 
    type: "friend",
    title: "João confirmou presença",
    message: "João confirmou presença no seu evento 'Festa Tropical'",
    time: "há 5 min",
    isNew: true
  },
  {
    id: "3",
    type: "reminder",
    title: "Lembrete de evento",
    message: "Festival Eletrônico Underground começa em 2 horas",
    time: "há 10 min",
    isNew: true
  },
  {
    id: "4",
    type: "like",
    title: "Curtidas no seu evento",
    message: "5 pessoas curtiram 'Rooftop Party'",
    time: "há 1h",
    isNew: false
  },
  {
    id: "5",
    type: "event",
    title: "Evento cancelado",
    message: "Infelizmente o 'Show de Jazz' foi cancelado",
    time: "há 2h",
    isNew: false
  }
];

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const newNotificationsCount = notifications.filter(n => n.isNew).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "event":
        return Calendar;
      case "friend":
        return Users;
      case "like":
        return Heart;
      case "reminder":
        return Bell;
      default:
        return Bell;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isNew: false }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isNew: false }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative hover:bg-primary/10"
        onClick={() => setIsOpen(!isOpen)}
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
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-surface cursor-pointer transition-colors ${
                        notification.isNew ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1 rounded-full ${
                          notification.isNew ? "bg-primary/20" : "bg-surface"
                        }`}>
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-1">
                              {notification.isNew && (
                                <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
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
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border">
              <Button variant="ghost" className="w-full text-sm">
                Ver todas as notificações
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}