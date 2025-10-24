import { Home, Search, Users, User, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userType: "user" | "organizer";
  onHomeRefresh?: () => void;
}

export function BottomNavigation({ activeTab, onTabChange, userType, onHomeRefresh }: BottomNavigationProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadMessagesCount = useUnreadMessages();

  const handleTabChange = (tab: string) => {
    // Tabs que exigem autenticação
    const protectedTabs = ['friends', 'profile'];

    if (protectedTabs.includes(tab) && !user) {
      const currentPath = location.pathname;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Se já está na home e clicou de novo, atualiza o feed
    if (tab === 'home' && activeTab === 'home' && onHomeRefresh) {
      onHomeRefresh();
      return;
    }

    onTabChange(tab);
  };

  // Different navigation items for each user type
  const userNavItems = [
    { id: "home", icon: Home, label: "Início" },
    { id: "friends", icon: Users, label: "Amigos" },
    { id: "profile", icon: User, label: "Perfil" },
  ];
  
  const organizerNavItems = [
    { id: "home", icon: Home, label: "Início" },
    { id: "create", icon: PlusCircle, label: "Criar" },
    { id: "profile", icon: User, label: "Perfil" },
  ];

  const navItems = userType === "organizer" ? organizerNavItems : userNavItems;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-smooth relative",
                isActive 
                  ? "text-primary glow-purple" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 transition-smooth",
                  isActive && "scale-110"
                )} 
              />
              <span className="text-xs font-medium">{item.label}</span>
              
              {/* Badge for unread messages on Friends tab */}
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