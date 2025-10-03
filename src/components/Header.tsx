import { MapPin } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
interface HeaderProps {
  title?: string;
  showLocation?: boolean;
  showNotifications?: boolean;
  userType?: "user" | "organizer";
}
export function Header({
  title = "Eventos",
  showLocation = true,
  showNotifications = true,
  userType
}: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNotificationClick = () => {
    if (!user) {
      const currentPath = location.pathname;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      toast.info('Faça login para ver suas notificações');
    }
  };

  return <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <h1 className="gradient-primary bg-clip-text text-[#1480cd] font-bold text-lg">
              {title}
            </h1>
            {userType && <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {userType === "organizer" ? "🎯 Organizador" : "👤 Usuário"}
              </span>}
          </div>
          {showLocation && <div className="flex items-center gap-1 text-sm text-muted-foreground ml-2">
              <MapPin className="h-4 w-4" />
              <span>Parauapebas</span>
            </div>}
        </div>

        {showNotifications && <NotificationDropdown onUnauthorizedClick={handleNotificationClick} />}
      </div>
    </header>;
}