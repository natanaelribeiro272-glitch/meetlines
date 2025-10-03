import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
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
  const [currentView, setCurrentView] = useState<"feed" | "eventDetails" | "findFriends" | "liveEvents" | "organizerProfile" | "organizersList" | "eventRegistration" | "eventAttendances" | "eventRegistrations" | "organizerEvents" | "editEvent">("feed");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { user, userRole, loading } = useAuth();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  // Verificar se organizador completou onboarding
  useEffect(() => {
    const checkOrganizerOnboarding = async () => {
      if (!user || loading || userRole === null) return;
      
      if (userRole !== "organizer") return;

      // Verificar se já tem organizer criado
      const { data: organizer } = await supabase
        .from("organizers")
        .select("id, username")
        .eq("user_id", user.id)
        .maybeSingle();

      // Se não tem organizer OU não tem username, redirecionar para onboarding
      if (!organizer || !organizer.username) {
        navigate("/organizer-onboarding", { replace: true });
      }
    };

    checkOrganizerOnboarding();
  }, [user, userRole, loading, navigate]);

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
    setCurrentOrganizerId(organizerId);
    setCurrentView("organizerProfile");
  };

  const handleShowOrganizers = () => {
    setCurrentView("organizersList");
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
          return <Home onEventClick={handleEventClick} onFindFriends={handleFindFriends} onOrganizerClick={handleOrganizerClick} onShowOrganizers={handleShowOrganizers} userType={userRole || "user"} />;
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
        return <FindFriends onBack={() => setActiveTab("home")} />;
      case "profile":
        // Different profile pages for different user types
        return userRole === "organizer" ? (
          <OrganizerPage />
        ) : (
          <UserProfile userType={userRole || "user"} />
        );
      default:
        return <Home onEventClick={handleEventClick} onFindFriends={handleFindFriends} onOrganizerClick={handleOrganizerClick} onShowOrganizers={handleShowOrganizers} userType={userRole || "user"} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} userType={userRole || "user"} />
    </div>
  );
}