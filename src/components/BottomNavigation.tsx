import { Home, Users, User, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface BottomNavigationProps {
  userType: "user" | "organizer";
}

export function BottomNavigation({ userType }: BottomNavigationProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadMessagesCount = useUnreadMessages();

  const handleNavigation = (path: string, requireAuth = false) => {
    if (requireAuth && !user) {
      const currentPath = location.pathname;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (path === '/' && location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    navigate(path);
  };

  const userNavItems = [
    { id: "home", icon: Home, label: "Início", path: "/", requireAuth: false },
    { id: "friends", icon: Users, label: "Amigos", path: "/amigos", requireAuth: true },
    { id: "profile", icon: User, label: "Perfil", path: "/perfil", requireAuth: true },
  ];

  const organizerNavItems = [
    { id: "home", icon: Home, label: "Início", path: "/", requireAuth: false },
    { id: "create", icon: PlusCircle, label: "Criar", path: "/criar-evento", requireAuth: true },
    { id: "profile", icon: User, label: "Perfil", path: "/organizador/perfil", requireAuth: true },
  ];

  const navItems = userType === "organizer" ? organizerNavItems : userNavItems;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path, item.requireAuth)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-smooth relative",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-smooth",
                  active && "scale-110"
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>

              {item.id === 'friends' && unreadMessagesCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-0 -right-0 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full animate-pulse"
                >
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}