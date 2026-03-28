import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import ThemeColorSync from "@/components/ThemeColorSync";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "./layouts/DashboardLayout.tsx";
import AuthEntryPage from "./pages/AuthEntryPage.tsx";
import HowItWorksPage from "./pages/HowItWorksPage.tsx";
import Index from "./pages/Index.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import PublicCarrierProfilePage from "./pages/PublicCarrierProfilePage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import AppSearchPage from "./pages/app/AppSearchPage.tsx";
import ConversationPage from "./pages/dashboard/ConversationPage.tsx";
import DashboardHome from "./pages/dashboard/DashboardHome.tsx";
import EditProfilePage from "./pages/dashboard/EditProfilePage.tsx";
import MessagesPage from "./pages/dashboard/MessagesPage.tsx";
import NewTripPage from "./pages/dashboard/NewTripPage.tsx";
import ProfilePage from "./pages/dashboard/ProfilePage.tsx";
import ShipmentsPage from "./pages/dashboard/ShipmentsPage.tsx";
import TripDetailsPage from "./pages/dashboard/TripDetailsPage.tsx";
import TripsPage from "./pages/dashboard/TripsPage.tsx";
import DisclaimerPage from "./pages/legal/DisclaimerPage.tsx";
import ImprintPage from "./pages/legal/ImprintPage.tsx";
import PrivacyPage from "./pages/legal/PrivacyPage.tsx";
import TermsPage from "./pages/legal/TermsPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <LocaleProvider>
          <BrowserRouter>
            <ThemeColorSync />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/transportistas/:userId" element={<PublicCarrierProfilePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth" element={<AuthEntryPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/legal/agb" element={<TermsPage />} />
              <Route path="/legal/privacy" element={<PrivacyPage />} />
              <Route path="/legal/disclaimer" element={<DisclaimerPage />} />
              <Route path="/legal/impressum" element={<ImprintPage />} />

              <Route path="/app" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="search" element={<AppSearchPage />} />
                <Route path="shipments" element={<ShipmentsPage />} />
                <Route path="trips" element={<TripsPage />} />
                <Route path="trips/new" element={<NewTripPage />} />
                <Route path="trips/:tripId" element={<TripDetailsPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="messages/:conversationId" element={<ConversationPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/edit" element={<EditProfilePage />} />
              </Route>
              <Route path="/dashboard/*" element={<Navigate to="/app" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </LocaleProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
