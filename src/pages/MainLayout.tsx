import { useState } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
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

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState("home");
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentOrganizerId, setCurrentOrganizerId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"feed" | "eventDetails" | "findFriends" | "liveEvents" | "organizerProfile" | "organizersList" | "eventRegistration" | "eventRegistrations" | "organizerEvents">("feed");

  const { user, userRole, loading } = useAuth();

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

  const handleBackToFeed = () => {
    setCurrentView("feed");
    setCurrentEventId(null);
    setCurrentOrganizerId(null);
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
              onFindFriends={handleFindFriends}
            />;
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
            return <EventRegistrations onBack={handleBackToFeed} />;
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