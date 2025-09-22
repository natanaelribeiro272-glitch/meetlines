import { Home, Search, Users, User, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userType: "user" | "organizer";
}

export function BottomNavigation({ activeTab, onTabChange, userType }: BottomNavigationProps) {
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
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-smooth",
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
            </button>
          );
        })}
      </div>
    </div>
  );
}