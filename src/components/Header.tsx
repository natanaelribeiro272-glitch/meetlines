import { Sun, Moon, Shield } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { LocationSelector } from "./LocationSelector";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "./ui/button";
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
  const {
    user
  } = useAuth();
  const {
    isAdmin
  } = useAdmin();
  const {
    theme,
    toggleTheme
  } = useTheme();
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
          {showLocation && <LocationSelector />}
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-8 w-8" title="Painel Admin">
              <Shield className="h-4 w-4 text-primary" />
            </Button>}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {showNotifications && <NotificationDropdown onUnauthorizedClick={handleNotificationClick} />}
        </div>
      </div>
    </header>;
}