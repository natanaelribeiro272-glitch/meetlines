import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOrganizer?: boolean;
  requireUser?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireOrganizer = false,
  requireUser = false
}: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (requireOrganizer && userRole !== "organizer") {
      navigate("/", { replace: true });
      return;
    }

    if (requireUser && userRole !== "user") {
      navigate("/", { replace: true });
      return;
    }
  }, [user, userRole, loading, navigate, requireAuth, requireOrganizer, requireUser]);

  useEffect(() => {
    const applyOrganizerTheme = async () => {
      if (!user || loading || userRole !== "organizer") return;

      const { data: organizer } = await supabase
        .from("organizers")
        .select("preferred_theme")
        .eq("user_id", user.id)
        .maybeSingle();

      if (organizer?.preferred_theme) {
        const theme = organizer.preferred_theme as 'dark' | 'light';
        setTheme(theme);
      }
    };

    applyOrganizerTheme();
  }, [user, userRole, loading, setTheme]);

  useEffect(() => {
    const checkUserOnboarding = async () => {
      if (!user || loading || userRole === null) return;

      const currentPath = window.location.pathname;
      if (currentPath.includes('onboarding')) return;

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return;
        }

        if (userRole === "organizer") {
          const { data: organizer } = await supabase
            .from("organizers")
            .select("id, username")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!organizer || !organizer.username) {
            navigate("/organizer-onboarding", { replace: true });
          }
        } else if (userRole === "user") {
          if (!profile || !profile.username) {
            navigate("/user-onboarding", { replace: true });
          }
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      }
    };

    checkUserOnboarding();
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
