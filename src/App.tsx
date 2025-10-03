import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import MainLayout from "./pages/MainLayout";
import PublicOrganizerProfile from "./pages/PublicOrganizerProfile";
import EventPublicPage from "./pages/EventPublicPage";
import AuthPage from "./pages/AuthPage";
import OrganizerOnboarding from "./pages/OrganizerOnboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <div className="dark">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />} />
              <Route path="/auth" element={<AuthPage onLogin={() => {}} />} />
              <Route path="/organizer-onboarding" element={<OrganizerOnboarding />} />
              {/* Public event share route: domain.com/@username/event-slug */}
              <Route path="/:organizerSlug/:eventSlug" element={<EventPublicPage />} />
              {/* Public organizer profile: domain.com/@username */}
              <Route path= "/:slug" element={<PublicOrganizerProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
