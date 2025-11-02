import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { userRole } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {children}
      <BottomNavigation userType={userRole || "user"} />
    </div>
  );
};
