import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface NotificationDropdownProps {
  onUnauthorizedClick?: () => void;
}

export function NotificationDropdown({ onUnauthorizedClick }: NotificationDropdownProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const handleClick = () => {
    if (!user) {
      if (onUnauthorizedClick) {
        onUnauthorizedClick();
      } else {
        navigate('/auth');
      }
    } else {
      navigate('/notifications');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative hover:bg-primary/10"
      onClick={handleClick}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center">
          <span className="text-[10px] text-destructive-foreground font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </div>
      )}
    </Button>
  );
}
