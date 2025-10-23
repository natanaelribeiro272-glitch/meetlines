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
import AdminDashboard from "./pages/AdminDashboard";
import AdminCreatePlatformEvent from "./pages/AdminCreatePlatformEvent";
import AdminClaimRequests from "./pages/AdminClaimRequests";
import AdminPlatformEvents from "./pages/AdminPlatformEvents";
import AdminEditPlatformEvent from "./pages/AdminEditPlatformEvent";
import AdminPlatformEventRegistrations from "./pages/AdminPlatformEventRegistrations";
import AdminSupport from "./pages/AdminSupport";
import AdminAutoGenerateEvents from "./pages/AdminAutoGenerateEvents";
import AdminPendingEvents from "./pages/AdminPendingEvents";
import AdminEditPendingEvent from "./pages/AdminEditPendingEvent";
import Notifications from "./pages/Notifications";
import TicketPurchaseSuccess from "./pages/TicketPurchaseSuccess";
import EventTicketSales from "./pages/EventTicketSales";
import AdminOrganizerPayments from "./pages/AdminOrganizerPayments";
import AdminOrganizerPaymentDetails from "./pages/AdminOrganizerPaymentDetails";
import UserEvents from "./pages/UserEvents";
import OrganizerFinancialPage from "./pages/OrganizerFinancialPage";

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
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/ticket-success" element={<TicketPurchaseSuccess />} />
              <Route path="/event/:eventId/sales" element={<EventTicketSales />} />
              <Route path="/my-events" element={<UserEvents />} />
              <Route path="/organizer-financial" element={<OrganizerFinancialPage />} />
              {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/create-platform-event" element={<AdminCreatePlatformEvent />} />
            <Route path="/admin/claims" element={<AdminClaimRequests />} />
            <Route path="/admin/platform-events" element={<AdminPlatformEvents />} />
            <Route path="/admin/platform-event/:eventId/edit" element={<AdminEditPlatformEvent />} />
            <Route path="/admin/platform-event/:eventId/registrations" element={<AdminPlatformEventRegistrations />} />
            <Route path="/admin/support" element={<AdminSupport />} />
            <Route path="/admin/auto-generate-events" element={<AdminAutoGenerateEvents />} />
            <Route path="/admin/pending-events" element={<AdminPendingEvents />} />
            <Route path="/admin/pending-event/:eventId/edit" element={<AdminEditPendingEvent />} />
            <Route path="/admin/organizer-payments" element={<AdminOrganizerPayments />} />
            <Route path="/admin/organizer-payments/:organizerId" element={<AdminOrganizerPaymentDetails />} />
              {/* Public routes - ordem importa: mais específico primeiro */}
              <Route path="/e/:eventId" element={<EventPublicPage />} />
              <Route path="/:organizerSlug/:eventSlug" element={<EventPublicPage />} />
              <Route path="/:combinedSlug" element={<EventPublicPage />} />
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
