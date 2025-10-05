import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import MainLayout from "./pages/MainLayout";
import PublicOrganizerProfile from "./pages/PublicOrganizerProfile";
import EventPublicPage from "./pages/EventPublicPage";
import AuthPage from "./pages/AuthPage";
import OrganizerOnboarding from "./pages/OrganizerOnboarding";
import UserOnboarding from "./pages/UserOnboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />} />
              <Route path="/auth" element={<AuthPage onLogin={() => {}} />} />
              <Route path="/organizer-onboarding" element={<OrganizerOnboarding />} />
              <Route path="/user-onboarding" element={<UserOnboarding />} />
              {/* Public event share route: domain.com/@username/event-slug */}
              <Route path="/:organizerSlug/:eventSlug" element={<EventPublicPage />} />
              {/* Public organizer profile: domain.com/@username */}
              <Route path= "/:slug" element={<PublicOrganizerProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
