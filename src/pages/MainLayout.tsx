import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "./AuthPage";
import Home from "./Home";
import EventDetails from "./EventDetails";
import FindFriends from "./FindFriends";
import OrganizerPage from "./OrganizerPage";
import UserProfile from "./UserProfile";
import LiveEvents from "./LiveEvents";
import OrganizerProfile from "./OrganizerProfile";
import CreateEvent from "./CreateEvent";
import OrdersManagement from "./OrdersManagement";
import OrganizersList from "./OrganizersList";
import EventRegistration from "./EventRegistration";
import EventRegistrations from "./EventRegistrations";
import OrganizerEvents from "./OrganizerEvents";
import EventAttendances from "./EventAttendances";

export default function MainLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentOrganizerId, setCurrentOrganizerId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"feed" | "eventDetails" | "findFriends" | "liveEvents" | "organizerProfile" | "organizersList" | "eventRegistration" | "eventAttendances" | "eventRegistrations" | "organizerEvents" | "editEvent">("feed");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);

  const { user, userRole, loading } = useAuth();
  const { setTheme } = useTheme();

  const handleHomeRefresh = () => {
    setCurrentView("feed");
    setHomeRefreshKey(prev => prev + 1);
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  // Aplicar tema do organizador quando ele faz login
  useEffect(() => {
    const applyOrganizerTheme = async () => {
      if (!user || loading || userRole !== "organizer") return;

      // Buscar preferência de tema do organizador
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

  // Verificar se user completou onboarding
  useEffect(() => {
    const checkUserOnboarding = async () => {
      if (!user || loading || userRole === null) return;

      // Avoid redirect loop - don't check if already on onboarding pages
      const currentPath = window.location.pathname;
      if (currentPath.includes('onboarding')) return;

      try {
        // Check if profile has username set
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", user.id)
          .maybeSingle();

        // If profile doesn't exist, it's a critical error
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return;
        }

        // Redirect based on role and profile completion
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
          // If user doesn't have username, redirect to user onboarding
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
  // Sync active tab from navigation state (e.g., navigate('/', { state: { initialTab: 'profile' } }))
  const location = useLocation();
  useEffect(() => {
    const state = (location.state as { initialTab?: string } | null) || null;
    if (state?.initialTab) {
      setActiveTab(state.initialTab);
      // Clear the state to avoid re-triggering when navigating within the app
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleLogin = (type: "user" | "organizer") => {
    // This is handled by the auth provider now
  };
  const handleEventClick = (eventId: string) => {
    if (eventId === "live-events") {
      setCurrentView("liveEvents");
    } else if (eventId === "register") {
      setCurrentView("eventRegistration");
    } else if (eventId === "registrations") {
      setCurrentView("eventRegistrations");
    } else {
      setCurrentEventId(eventId);
      setCurrentView("eventDetails");
    }
  };

  const handleFindFriends = () => {
    setCurrentView("findFriends");
  };

  const handleOrganizerClick = (organizerId: string) => {
    console.log('handleOrganizerClick chamado com ID:', organizerId);
    if (!organizerId) {
      console.error('ID do organizador está vazio!');
      return;
    }
    setCurrentOrganizerId(organizerId);
    setCurrentView("organizerProfile");
  };

  const handleShowOrganizers = () => {
    setCurrentView("organizersList");
  };

  const handleStoryClick = (userId: string) => {
    setCurrentUserId(userId);
    // O viewer de story de usuário já está sendo gerenciado no StoriesBar
  };

  const handleEditEvent = (eventId: string) => {
    setEditingEventId(eventId);
    setCurrentView("editEvent");
  };

  const handleBackToFeed = () => {
    setCurrentView("feed");
    setCurrentEventId(null);
    setCurrentOrganizerId(null);
    setEditingEventId(null);
  };

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

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        switch (currentView) {
          case "eventDetails":
            return <EventDetails 
              onBack={handleBackToFeed} 
              eventId={currentEventId}
              onRegister={() => {
                setCurrentView("eventRegistration");
              }}
              onManageRegistrations={() => {
                setCurrentView("eventRegistrations");
              }}
              onViewAttendances={() => {
                setCurrentView("eventAttendances");
              }}
              onFindFriends={handleFindFriends}
              onEdit={handleEditEvent}
            />;
          case "editEvent":
            return <CreateEvent onBack={handleBackToFeed} eventId={editingEventId || undefined} />;
          case "findFriends":
            return <FindFriends onBack={handleBackToFeed} />;
          case "liveEvents":
            return <LiveEvents onBack={handleBackToFeed} onEventClick={handleEventClick} />;
          case "organizerProfile":
            return <OrganizerProfile onBack={handleBackToFeed} organizerId={currentOrganizerId || undefined} onEventClick={handleEventClick} />;
          case "organizersList":
            return <OrganizersList onBack={handleBackToFeed} onOrganizerClick={handleOrganizerClick} />;
          case "eventRegistration":
            return <EventRegistration onBack={handleBackToFeed} eventId={currentEventId || undefined} />;
          case "eventRegistrations":
            return <EventRegistrations onBack={handleBackToFeed} eventId={currentEventId || undefined} />;
          case "eventAttendances":
            return <EventAttendances onBack={handleBackToFeed} eventId={currentEventId || undefined} />;
          default:
          return <Home onEventClick={handleEventClick} onFindFriends={handleFindFriends} onOrganizerClick={handleOrganizerClick} onShowOrganizers={handleShowOrganizers} onStoryClick={handleStoryClick} userType={userRole || "user"} refreshKey={homeRefreshKey} />;
        }
      case "create":
        // Only organizers can create events
        if (userRole === "organizer") {
          return <CreateEvent onBack={() => setActiveTab("home")} />;
        } else {
          // Redirect users back to home
          setActiveTab("home");
          return null;
        }
      case "friends":
        // Apenas usuários comuns podem acessar "Encontrar Amigos"
        if (userRole === "user") {
          return <FindFriends onBack={() => setActiveTab("home")} />;
        } else {
          // Redirecionar organizadores de volta ao feed
          setActiveTab("home");
          return null;
        }
      case "profile":
        // Different profile pages for different user types
        return userRole === "organizer" ? (
          <OrganizerPage />
        ) : (
          <UserProfile userType={userRole || "user"} />
        );
      default:
        return <Home onEventClick={handleEventClick} onFindFriends={handleFindFriends} onOrganizerClick={handleOrganizerClick} onShowOrganizers={handleShowOrganizers} onStoryClick={handleStoryClick} userType={userRole || "user"} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} userType={userRole || "user"} onHomeRefresh={handleHomeRefresh} />
    </div>
  );
}